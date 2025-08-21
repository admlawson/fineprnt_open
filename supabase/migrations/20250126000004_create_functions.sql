-- Create database functions

-- Function to check and increment rate limits
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_user_id uuid,
  p_bucket text,
  p_window_seconds integer,
  p_limit integer
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  bucket_start timestamptz;
  current_count integer;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;
  IF p_window_seconds IS NULL OR p_window_seconds <= 0 THEN
    p_window_seconds := 60;
  END IF;
  IF p_limit IS NULL OR p_limit <= 0 THEN
    p_limit := 30;
  END IF;

  bucket_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  INSERT INTO public.api_rate_limits(user_id, bucket, window_start, request_count)
  VALUES (p_user_id, coalesce(p_bucket, 'default'), bucket_start, 1)
  ON CONFLICT (user_id, bucket, window_start)
  DO UPDATE SET request_count = public.api_rate_limits.request_count + 1
  RETURNING request_count INTO current_count;

  RETURN current_count <= p_limit;
END;
$$;

-- Function to finalize document processing
CREATE OR REPLACE FUNCTION public.finalize_processing(
  p_document_id uuid,
  p_success boolean
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_user uuid;
  v_hold record;
BEGIN
  SELECT user_id INTO v_user FROM documents WHERE id = p_document_id;
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'doc_not_found';
  END IF;
  
  SELECT * INTO v_hold FROM document_credit_holds WHERE document_id = p_document_id LIMIT 1;
  
  IF p_success THEN
    IF v_hold IS NOT NULL THEN
      UPDATE document_credits 
      SET credits_used = credits_used + 1, updated_at = now() 
      WHERE user_id = v_user AND period_start = v_hold.period_start;
      
      DELETE FROM document_credit_holds WHERE id = v_hold.id;
      
      INSERT INTO document_usage_log(user_id, document_id, event) 
      VALUES (v_user, p_document_id, 'credit_consumed');
    END IF;
    
    UPDATE documents SET status = 'completed', updated_at = now() WHERE id = p_document_id;
    RETURN jsonb_build_object('ok', true, 'consumed', true);
  ELSE
    IF v_hold IS NOT NULL THEN
      DELETE FROM document_credit_holds WHERE id = v_hold.id;
      INSERT INTO document_usage_log(user_id, document_id, event) 
      VALUES (v_user, p_document_id, 'credit_hold_released');
    END IF;
    
    UPDATE documents SET status = 'failed', updated_at = now() WHERE id = p_document_id;
    RETURN jsonb_build_object('ok', true, 'consumed', false);
  END IF;
END;
$$;

-- Function to get credit summary for current user
CREATE OR REPLACE FUNCTION public.get_credit_summary(p_user_id uuid)
RETURNS TABLE(
  period_start timestamptz,
  period_end timestamptz,
  starting_credits integer,
  credits_used integer,
  overage_units integer,
  credits_available integer
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT period_start, period_end, starting_credits, credits_used, overage_units,
         (starting_credits + overage_units - credits_used) as credits_available
  FROM document_credits WHERE user_id = p_user_id ORDER BY period_start DESC LIMIT 1;
$$;

-- Function for hybrid search (vector + text search)
CREATE OR REPLACE FUNCTION public.hybrid_search(
  query_text text,
  query_embedding text,
  match_document_id uuid,
  user_id uuid,
  match_threshold double precision DEFAULT 0,
  match_count integer DEFAULT 12,
  user_org_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id bigint,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity double precision,
  text_rank double precision,
  score double precision
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH scoped AS (
    SELECT v.*
    FROM public.document_vectors v
    JOIN public.documents d ON d.id = v.document_id
    WHERE v.document_id = match_document_id
      AND d.user_id = user_id
  )
  SELECT
    s.id,
    s.document_id,
    s.content,
    s.metadata,
    s.similarity,
    s.text_rank,
    (0.6 * s.similarity + 0.4 * s.text_rank) as score
  FROM (
    SELECT
      v.id,
      v.document_id,
      v.content,
      v.metadata,
      (1 - (v.embedding <=> (query_embedding::vector))) as similarity,
      ts_rank_cd(
        to_tsvector('english', coalesce(v.content, '')),
        websearch_to_tsquery('english', coalesce(nullif(query_text, ''), ' '))
      ) as text_rank
    FROM scoped v
  ) s
  WHERE (0.6 * s.similarity + 0.4 * s.text_rank) >= coalesce(match_threshold, 0)
  ORDER BY score DESC
  LIMIT coalesce(match_count, 12);
$$;

-- Function to resume awaiting documents
CREATE OR REPLACE FUNCTION public.resume_awaiting_docs(
  p_user_id uuid,
  p_max integer DEFAULT 10
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_count integer := 0;
  v_doc record;
  v_result jsonb;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 0;
  END IF;

  FOR v_doc IN
    SELECT id FROM documents
    WHERE user_id = p_user_id AND status = 'awaiting_credit'
    ORDER BY created_at ASC
    LIMIT p_max
  LOOP
    SELECT public.start_processing(v_doc.id) INTO v_result;
    IF coalesce((v_result->>'ok')::boolean, false) THEN
      v_count := v_count + 1;
    ELSE
      -- Stop if no credits or blocked
      IF (v_result->>'reason') IS NOT NULL THEN
        EXIT;
      END IF;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Function to start document processing
CREATE OR REPLACE FUNCTION public.start_processing(
  p_document_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_user uuid;
  v_now timestamptz := now();
  v_period_start timestamptz;
  v_start int;
  v_overage int;
  v_used int;
  v_active_holds int;
  v_available int;
BEGIN
  SELECT user_id INTO v_user FROM documents WHERE id = p_document_id;
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'doc_not_found';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM documents 
    WHERE id = p_document_id 
    AND user_id = v_user 
    AND status IN ('uploaded','failed','awaiting_credit')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_status');
  END IF;
  
  SELECT period_start, starting_credits, overage_units, credits_used 
  INTO v_period_start, v_start, v_overage, v_used 
  FROM document_credits 
  WHERE user_id = v_user 
    AND v_now >= period_start 
    AND v_now < period_end 
  FOR UPDATE;
  
  IF v_period_start IS NULL THEN
    UPDATE documents SET status = 'awaiting_credit', updated_at = now() 
    WHERE id = p_document_id AND user_id = v_user;
    RETURN jsonb_build_object('ok', false, 'reason', 'no_active_period');
  END IF;
  
  SELECT count(*) INTO v_active_holds 
  FROM document_credit_holds 
  WHERE user_id = v_user 
    AND period_start = v_period_start 
    AND expires_at > v_now;
  
  v_available := (coalesce(v_start,0) + coalesce(v_overage,0) - coalesce(v_used,0) - coalesce(v_active_holds,0));
  
  IF v_available > 0 THEN
    INSERT INTO document_credit_holds(user_id, document_id, period_start, expires_at) 
    VALUES (v_user, p_document_id, v_period_start, v_now + interval '2 hours');
    
    INSERT INTO document_usage_log(user_id, document_id, event) 
    VALUES (v_user, p_document_id, 'credit_hold_created');
    
    UPDATE documents SET status = 'queued', updated_at = now() 
    WHERE id = p_document_id AND user_id = v_user;
    
    INSERT INTO processing_jobs(document_id, stage, status, input_data) 
    VALUES (p_document_id, 'ocr', 'queued', jsonb_build_object('document_id', p_document_id));
    
    RETURN jsonb_build_object('ok', true);
  ELSE
    UPDATE documents SET status = 'awaiting_credit', updated_at = now() 
    WHERE id = p_document_id AND user_id = v_user;
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_credits');
  END IF;
END;
$$;

-- Function to touch updated_at timestamp
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
