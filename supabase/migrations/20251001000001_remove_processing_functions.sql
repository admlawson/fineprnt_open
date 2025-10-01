-- Remove old processing functions that depend on user_id and credit system
DROP FUNCTION IF EXISTS public.start_processing(uuid);
DROP FUNCTION IF EXISTS public.finalize_processing(uuid, boolean);

-- Create new simplified processing function without authentication
CREATE OR REPLACE FUNCTION public.start_processing(p_document_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if document exists and is in a valid status
  IF NOT EXISTS (
    SELECT 1 FROM documents 
    WHERE id = p_document_id 
    AND status IN ('uploaded','failed')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_status');
  END IF;
  
  -- Update document status to queued
  UPDATE documents 
  SET status = 'queued', updated_at = now() 
  WHERE id = p_document_id;
  
  -- Create processing job
  INSERT INTO processing_jobs(document_id, stage, status, input_data) 
  VALUES (p_document_id, 'ocr', 'queued', jsonb_build_object('document_id', p_document_id));
  
  RETURN jsonb_build_object('ok', true);
END;
$$;
