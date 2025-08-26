-- Migration: Enhance RAG System for Better Chunking and Search
-- This migration adds support for idempotent chunk upserts and hybrid search capabilities

-- Add hash column for idempotent upserts
ALTER TABLE document_vectors ADD COLUMN IF NOT EXISTS hash text;

-- Add tsvector column for full-text search (BM25)
ALTER TABLE document_vectors ADD COLUMN IF NOT EXISTS tsv tsvector 
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

-- Create unique index on (document_id, hash) for idempotent upserts
CREATE UNIQUE INDEX IF NOT EXISTS document_vectors_doc_hash_ux 
  ON document_vectors (document_id, hash);

-- Create GIN index on tsvector for fast full-text search
CREATE INDEX IF NOT EXISTS document_vectors_tsv_idx 
  ON document_vectors USING GIN (tsv);

-- Ensure embedding column is properly typed for pgvector
-- Note: This assumes you already have pgvector extension and vector column
-- If not, you'll need to run:
-- CREATE EXTENSION IF NOT EXISTS vector;
-- ALTER TABLE document_vectors ALTER COLUMN embedding TYPE vector(1536);

-- Add comment explaining the new columns
COMMENT ON COLUMN document_vectors.hash IS 'SHA1 hash of content for idempotent upserts';
COMMENT ON COLUMN document_vectors.tsv IS 'Generated tsvector for full-text search capabilities';

-- Update existing rows to populate hash column (if any exist)
-- This is safe to run multiple times due to IF NOT EXISTS
-- Note: We'll use a simple hash function since crypto functions may not be available in migration context
UPDATE document_vectors 
SET hash = encode(sha256(content::bytea), 'hex')::text 
WHERE hash IS NULL;

-- Create a function to help with hybrid search ranking
-- This combines vector similarity with full-text search ranking
CREATE OR REPLACE FUNCTION hybrid_search_rank(
  query_text text,
  query_embedding vector(1536),
  match_document_id uuid,
  match_threshold float DEFAULT 0.15,
  match_count int DEFAULT 15
) RETURNS TABLE(
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity float,
  text_rank float,
  combined_score float
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dv.id,
    dv.document_id,
    dv.content,
    dv.metadata,
    (1 - (dv.embedding <=> query_embedding))::float as similarity,
    ts_rank(dv.tsv, plainto_tsquery('english', query_text))::float as text_rank,
    -- Combine vector similarity (60%) with text rank (40%)
    (0.6 * (1 - (dv.embedding <=> query_embedding)) + 0.4 * ts_rank(dv.tsv, plainto_tsquery('english', query_text)))::float as combined_score
  FROM document_vectors dv
  WHERE dv.document_id = match_document_id
    AND (1 - (dv.embedding <=> query_embedding)) >= match_threshold
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION hybrid_search_rank TO authenticated;
GRANT EXECUTE ON FUNCTION hybrid_search_rank TO service_role;

-- Add comment explaining the function
COMMENT ON FUNCTION hybrid_search_rank IS 'Hybrid search combining vector similarity with full-text search ranking for better RAG results';
