-- Fineprnt Database Setup
-- This migration sets up the complete database schema for Fineprnt

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    sha256 TEXT NOT NULL UNIQUE,
    file_size BIGINT CHECK (file_size > 0 AND file_size <= 52428800), -- 50MB limit
    mime_type TEXT,
    storage_path TEXT,
    status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'queued', 'processing', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create document_text table for storing extracted text
CREATE TABLE IF NOT EXISTS public.document_text (
    document_id UUID PRIMARY KEY REFERENCES public.documents(id) ON DELETE CASCADE,
    markdown TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create document_vectors table for storing embeddings
CREATE TABLE IF NOT EXISTS public.document_vectors (
    id BIGSERIAL PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    chunk_order INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI text-embedding-3-small dimensions
    page_number INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    hash TEXT, -- SHA1 hash of content for idempotent upserts
    tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content)) STORED
);

-- Create processing_jobs table for tracking document processing
CREATE TABLE IF NOT EXISTS public.processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    stage TEXT NOT NULL CHECK (stage IN ('ingest', 'ocr', 'annotation', 'vectorization', 'embed', 'finalize')),
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'done', 'failed')),
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    message_count INTEGER DEFAULT 0
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    sequence_number INTEGER NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at);
CREATE INDEX IF NOT EXISTS idx_document_vectors_document_id ON public.document_vectors(document_id);
CREATE INDEX IF NOT EXISTS idx_document_vectors_embedding ON public.document_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_document_vectors_tsv ON public.document_vectors USING gin(tsv);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_document_id ON public.processing_jobs(document_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON public.processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_document_id ON public.chat_sessions(document_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sequence ON public.chat_messages(session_id, sequence_number);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_updated_at();

-- Create hybrid search function
CREATE OR REPLACE FUNCTION public.hybrid_search(
    query_text TEXT,
    query_embedding TEXT,
    match_document_id UUID,
    match_threshold DOUBLE PRECISION DEFAULT 0,
    match_count INTEGER DEFAULT 12
)
RETURNS TABLE(
    id BIGINT,
    document_id UUID,
    content TEXT,
    metadata JSONB,
    similarity DOUBLE PRECISION,
    text_rank DOUBLE PRECISION,
    score DOUBLE PRECISION
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    WITH scoped AS (
        SELECT v.*
        FROM public.document_vectors v
        JOIN public.documents d ON d.id = v.document_id
        WHERE v.document_id = match_document_id
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

-- Create rate limiting function
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
    p_user_id UUID,
    p_limit_count INTEGER DEFAULT 10,
    p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- For open source version, always allow (no rate limiting)
    RETURN TRUE;
END;
$$;

-- Create simplified processing function
CREATE OR REPLACE FUNCTION public.start_processing(p_document_id UUID)
RETURNS JSONB
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

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for documents bucket
CREATE POLICY "Allow public access to documents" ON storage.objects
FOR ALL USING (bucket_id = 'documents');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
