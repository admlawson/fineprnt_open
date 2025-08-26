# RAG System Improvements

This document outlines the improvements made to the RAG (Retrieval-Augmented Generation) system in the OmniClause B2C platform.

## Overview

The RAG system has been enhanced with:
- **Token-aware chunking** with legal boundary detection
- **Idempotent chunk storage** using content hashing
- **Hybrid search** combining vector similarity with full-text search
- **Shared contract intelligence** for consistent type detection
- **Improved embedding generation** with retries and batching

## Key Improvements

### 1. Token-Aware Chunking

**Before**: Chunks were created based on word count (~400 words)
**After**: Chunks are created based on estimated tokens (~900 tokens, max 2000)

**Benefits**:
- Better alignment with LLM token limits
- More consistent chunk sizes for embedding models
- Improved retrieval quality

**Implementation**:
```typescript
const TARGET_TOKENS = 900; // Target chunk size in tokens
const MAX_TOKENS = 2000;   // Hard cap on chunk size
const OVERLAP_TOKENS = 120; // Overlap in tokens to maintain context

const estimateTokens = (s: string) => Math.ceil(s.length / 4);
```

### 2. Legal Boundary Detection

**Before**: Simple paragraph-based splitting
**After**: Intelligent splitting at legal document boundaries

**Boundaries Detected**:
- Headings (`# Section`, `## Subsection`)
- Articles (`ARTICLE I`, `ARTICLE II`)
- Numbered sections (`Section 1.1`, `Section 2.3`)
- Numbered clauses (`1.1 Obligations:`, `2.3 Payment Terms:`)
- Double line breaks

**Benefits**:
- Chunks respect legal document structure
- Better context preservation
- More meaningful chunk boundaries

### 3. OCR Text Normalization

**Before**: Raw OCR text processing
**After**: Intelligent text cleanup before chunking

**Normalizations Applied**:
- Join hyphenated line wraps: `"perfor-\nmance"` → `"performance"`
- Collapse hard line breaks inside paragraphs
- Normalize whitespace and indentation

**Benefits**:
- Cleaner, more readable chunks
- Better semantic understanding
- Improved embedding quality

### 4. Idempotent Chunk Storage

**Before**: Simple INSERT operations (potential duplicates on re-runs)
**After**: UPSERT operations using content hashing

**Implementation**:
```typescript
// Generate SHA1 hash for each chunk
const hash = makeHash(content);

// Use upsert with conflict resolution
const { error } = await supabase
  .from('document_vectors')
  .upsert(batch, { 
    onConflict: 'document_id,hash', 
    ignoreDuplicates: true 
  });
```

**Benefits**:
- No duplicate chunks on re-processing
- Safe to re-run embedding jobs
- Consistent chunk ordering

### 5. Enhanced Embedding Generation

**Before**: Single API call for all chunks
**After**: Intelligent batching with retries and validation

**Features**:
- **Token-based batching**: Respects OpenAI's token limits
- **Exponential backoff**: Handles rate limiting gracefully
- **Dimension validation**: Ensures 1536-dimensional embeddings
- **Retry logic**: Up to 5 attempts with intelligent backoff

**Implementation**:
```typescript
// Batch by token budget
const batches = batchByTokenBudget(chunks, 150_000);

// Retry with exponential backoff
if ((response.status === 429 || response.status >= 500) && attempt <= 5) {
  const backoff = Math.min(2000 * Math.pow(2, attempt - 1), 20000) + Math.random() * 250;
  await new Promise(resolve => setTimeout(resolve, backoff));
  attempt++;
  continue;
}
```

### 6. Shared Contract Intelligence

**Before**: Duplicate contract type detection in multiple functions
**After**: Single source of truth for contract types and query expansion

**Benefits**:
- Consistent contract type detection
- Unified keyword lexicons
- Easier maintenance and updates

**Location**: `supabase/functions/_shared/contracts.ts`

### 7. Hybrid Search Capabilities

**Before**: Vector-only search with fallback to keyword search
**After**: Combined vector similarity + full-text search (BM25)

**Implementation**:
```sql
-- Combine vector similarity (60%) with text rank (40%)
(0.6 * (1 - (dv.embedding <=> query_embedding)) + 
 0.4 * ts_rank(dv.tsv, plainto_tsquery('english', query_text)))::float as combined_score
```

**Benefits**:
- Better recall for keyword-heavy queries
- Improved ranking for semantic matches
- More robust search results

## Database Schema Changes

### New Columns

```sql
-- Hash for idempotent upserts
ALTER TABLE document_vectors ADD COLUMN hash text;

-- Full-text search vector
ALTER TABLE document_vectors ADD COLUMN tsv tsvector 
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
```

### New Indexes

```sql
-- Unique constraint for upserts
CREATE UNIQUE INDEX document_vectors_doc_hash_ux 
  ON document_vectors (document_id, hash);

-- Full-text search index
CREATE INDEX document_vectors_tsv_idx 
  ON document_vectors USING GIN (tsv);
```

### New Functions

```sql
-- Hybrid search ranking function
CREATE OR REPLACE FUNCTION hybrid_search_rank(
  query_text text,
  query_embedding vector(1536),
  match_document_id uuid,
  match_threshold float DEFAULT 0.15,
  match_count int DEFAULT 15
)
```

## Migration Guide

### 1. Run Database Migration

```bash
# Apply the new migration
supabase db push
```

### 2. Update Existing Chunks (Optional)

If you have existing chunks, you can populate the hash column:

```sql
UPDATE document_vectors 
SET hash = encode(sha256(content::bytea), 'hex')::text 
WHERE hash IS NULL;
```

### 3. Redeploy Edge Functions

```bash
supabase functions deploy chunk_and_embed
supabase functions deploy chat_rag
```

## Performance Considerations

### Chunking Performance
- **Token estimation**: O(n) where n is text length
- **Legal boundary detection**: O(n) with regex optimization
- **Sentence splitting**: O(n) with lookahead regex

### Storage Performance
- **Hash generation**: SHA1 is fast and collision-resistant
- **Upsert operations**: Unique index ensures O(log n) performance
- **Full-text search**: GIN index provides fast text search

### Search Performance
- **Vector similarity**: pgvector IVF index for fast similarity search
- **Full-text search**: GIN index for fast text ranking
- **Hybrid ranking**: Combines both for optimal results

## Monitoring and Debugging

### Debug Mode

Enable debug mode to see detailed logging:

```bash
# Set environment variable
export DEBUG_MODE=true
```

### Key Metrics to Monitor

1. **Chunk creation**: Number of chunks per document
2. **Embedding generation**: Success rate and timing
3. **Search performance**: Query response times
4. **Storage efficiency**: Chunk size distribution

### Common Issues and Solutions

#### Issue: Chunks too large/small
**Solution**: Adjust `TARGET_TOKENS` and `MAX_TOKENS` constants

#### Issue: Embedding API failures
**Solution**: Check retry logic and rate limiting

#### Issue: Search returning poor results
**Solution**: Verify hybrid search function exists and is working

## Future Enhancements

### Planned Improvements

1. **Dynamic chunk sizing**: Adjust based on document complexity
2. **Multi-language support**: Extend beyond English
3. **Semantic chunking**: Use LLM to determine optimal boundaries
4. **Incremental updates**: Update only changed chunks

### Research Areas

1. **Chunk overlap optimization**: Dynamic overlap based on content
2. **Query-specific chunking**: Tailor chunks to expected query types
3. **Cross-document linking**: Connect related chunks across documents

## Conclusion

These improvements significantly enhance the RAG system's quality, reliability, and performance. The token-aware chunking, legal boundary detection, and hybrid search capabilities work together to provide more accurate and relevant results for contract analysis.

The idempotent storage and improved error handling make the system more robust and maintainable, while the shared contract intelligence ensures consistency across all components.
