Name of function=check_and_increment_rate_limit

Schema=public

Arguments
p_user_id
uuid
p_bucket
text
p_window_seconds
integer
p_limit
integer

Definition
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

Name of function=finalize_processing

Schema=public

Arguments
p_document_id
uuid
boolean

Definition

declare v_user uuid; v_hold record; begin
  select user_id into v_user from documents where id = p_document_id; if v_user is null then raise exception 'doc_not_found'; end if;
  select * into v_hold from document_credit_holds where document_id = p_document_id limit 1;
  if p_success then
    if v_hold is not null then
      update document_credits set credits_used = credits_used + 1, updated_at = now() where user_id = v_user and period_start = v_hold.period_start;
      delete from document_credit_holds where id = v_hold.id;
      insert into document_usage_log(user_id, document_id, event) values (v_user, p_document_id, 'credit_consumed');
    end if;
    update documents set status = 'completed', updated_at = now() where id = p_document_id;
    return jsonb_build_object('ok', true, 'consumed', true);
  else
    if v_hold is not null then delete from document_credit_holds where id = v_hold.id; insert into document_usage_log(user_id, document_id, event) values (v_user, p_document_id, 'credit_hold_released'); end if;
    update documents set status = 'failed', updated_at = now() where id = p_document_id;
    return jsonb_build_object('ok', true, 'consumed', false);
  end if;
end; 

Name of function=get_credit_summary
Schema=public
Arguments

Definition

  select period_start, period_end, starting_credits, credits_used, overage_units,
         (starting_credits + overage_units - credits_used) as credits_available
  from document_credits where user_id = auth.uid() order by period_start desc limit 1;

Name of function=hybrid_search
Schema=public
Arguments
query_text
text
query_embedding
text
match_document_id
uuid
match_threshold
double
match_count
integer
user_org_id
uuid

Definition

  with scoped as (
    select v.*
    from public.document_vectors v
    join public.documents d on d.id = v.document_id
    where v.document_id = match_document_id
      and d.user_id = auth.uid()
  )
  select
    s.id,
    s.document_id,
    s.content,
    s.metadata,
    s.similarity,
    s.text_rank,
    (0.6 * s.similarity + 0.4 * s.text_rank) as score
  from (
    select
      v.id,
      v.document_id,
      v.content,
      v.metadata,
      (1 - (v.embedding <=> (query_embedding::vector))) as similarity,
      ts_rank_cd(
        to_tsvector('english', coalesce(v.content, '')),
        websearch_to_tsquery('english', coalesce(nullif(query_text, ''), ' '))
      ) as text_rank
    from scoped v
  ) s
  where (0.6 * s.similarity + 0.4 * s.text_rank) >= coalesce(match_threshold, 0)
  order by score desc
  limit coalesce(match_count, 12)


Name of function=resume_awaiting_docs
schema=public
Arguments
p_user_id
uuid
p_max
integer

Definition

declare
  v_count integer := 0;
  v_doc record;
  v_result jsonb;
begin
  if p_user_id is null then
    return 0;
  end if;

  for v_doc in
    select id from documents
    where user_id = p_user_id and status = 'awaiting_credit'
    order by created_at asc
    limit p_max
  loop
    select public.start_processing(v_doc.id) into v_result;
    if coalesce((v_result->>'ok')::boolean, false) then
      v_count := v_count + 1;
    else
      -- Stop if no credits or blocked
      if (v_result->>'reason') is not null then
        exit;
      end if;
    end if;
  end loop;

  return v_count;
end; 

Name of function=start_processing
schema=public
Arguments
p_document_id
uuid

Definition

declare v_user uuid; v_now timestamptz := now(); v_period_start timestamptz; v_start int; v_overage int; v_used int; v_active_holds int; v_available int; begin
  select user_id into v_user from documents where id = p_document_id;
  if v_user is null or v_user <> auth.uid() then raise exception 'not_owner'; end if;
  if not exists (select 1 from documents where id = p_document_id and user_id = v_user and status in ('uploaded','failed','awaiting_credit')) then
    return jsonb_build_object('ok', false, 'reason', 'invalid_status');
  end if;
  select period_start, starting_credits, overage_units, credits_used into v_period_start, v_start, v_overage, v_used from document_credits where user_id = v_user and v_now >= period_start and v_now < period_end for update;
  if v_period_start is null then
    update documents set status = 'awaiting_credit', updated_at = now() where id = p_document_id and user_id = v_user;
    return jsonb_build_object('ok', false, 'reason', 'no_active_period');
  end if;
  select count(*) into v_active_holds from document_credit_holds where user_id = v_user and period_start = v_period_start and expires_at > v_now;
  v_available := (coalesce(v_start,0) + coalesce(v_overage,0) - coalesce(v_used,0) - coalesce(v_active_holds,0));
  if v_available > 0 then
    insert into document_credit_holds(user_id, document_id, period_start, expires_at) values (v_user, p_document_id, v_period_start, v_now + interval '2 hours');
    insert into document_usage_log(user_id, document_id, event) values (v_user, p_document_id, 'credit_hold_created');
    update documents set status = 'queued', updated_at = now() where id = p_document_id and user_id = v_user;
    insert into processing_jobs(document_id, stage, status, input_data) values (p_document_id, 'ocr', 'queued', jsonb_build_object('document_id', p_document_id));
    return jsonb_build_object('ok', true);
  else
    update documents set status = 'awaiting_credit', updated_at = now() where id = p_document_id and user_id = v_user;
    return jsonb_build_object('ok', false, 'reason', 'insufficient_credits');
  end if;
end; 

Name of function=touch_updated_at
schema=public
Arguments

Definition
 begin new.updated_at := now(); return new; end 