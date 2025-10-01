// @ts-expect-error - Deno environment types not available
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildCorsHeaders, handleCors } from '../_shared/cors.ts';
import { detectContractType } from '../_shared/contracts.ts';

// Deno type declarations
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

// --- INTERFACES ---
interface PageData {
  index: number;
  markdown: string;
}

interface ProcessingJobData {
  id: string;
  document_id: string;
  stage: string;
  status: string;
  input_data: {
    pages: PageData[];
  };
}

// ENHANCEMENT: The chunk now includes rich metadata for citations and idempotency
interface DocumentChunk {
  document_id: string;
  chunk_order: number;
  content: string;
  embedding?: number[];
  metadata: {
    page_number: number;
    section_title?: string;
    contract_type?: string;
    citation_key?: string; // For generating [p{page}, "{section}"] format
    chunk_type?: 'definition' | 'clause' | 'general' | 'header';
    hash?: string; // NEW: sha1(content) for idempotent upserts
  }
}

// --- INITIALIZATION ---
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- CONSTANTS ---
const EMBEDDING_MODEL = 'text-embedding-3-small';
const TARGET_TOKENS = 900; // Target chunk size in tokens
const MAX_TOKENS = 2000; // Hard cap on chunk size
const OVERLAP_TOKENS = 120; // Overlap in tokens to maintain context
const MAX_CHUNKS_PER_BATCH = 100; // How many chunks to insert into the DB at once

// --- UTILITY FUNCTIONS ---

/**
 * Rough token estimation (no tiktoken needed on edge)
 * OpenAI models typically use ~4 characters per token
 */
const estimateTokens = (s: string) => Math.ceil(s.length / 4);

/**
 * Normalize text for better chunking:
 * - Join hyphenated line wraps: "perfor-\nmance" -> "performance"
 * - Collapse hard line breaks inside paragraphs
 * - Normalize whitespace
 */
const normalizeText = (s: string) =>
  s
    .replace(/(\w)-\n(\w)/g, '$1$2')
    .replace(/[ \t]*\n(?!\n)/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

/**
 * Split text at legal boundaries:
 * - Headings (# Section, ## Subsection)
 * - Articles (ARTICLE I, ARTICLE II, etc.)
 * - Numbered sections (Section 1.1, Section 2.3)
 * - Numbered clauses (1.1 Obligations:, 2.3 Payment Terms:)
 * - Double line breaks
 */
const legalBoundaries = (s: string) =>
  s.split(
    /(?=^#{1,6}\s|^ARTICLE\s+[IVXLC]+|^Section\s+\d+(\.\d+)*\b|^\d+(\.\d+)*\s+[^:\n]+:|\n{2,})/gmi
  ).filter(x => x.trim().length);

/**
 * Split text into sentences for fine-grained chunking
 */
const sentenceSplit = (s: string) =>
  s.split(/(?<=[.?!])\s+(?=[A-Z(""0-9])/).filter(x => x.trim().length);

/**
 * Create SHA1 hash for idempotent upserts using Web Crypto API
 * This is more compatible with Supabase Edge Functions
 */
const makeHash = async (s: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(s);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Determine chunk type based on section content
 */
const determineChunkType = (title: string, content: string): 'definition' | 'clause' | 'general' | 'header' => {
  const lowerTitle = title.toLowerCase();
  const lowerContent = content.toLowerCase();
  
  if (lowerTitle.includes('definition') || lowerTitle.includes('definitions') || 
      lowerContent.includes('means') || lowerContent.includes('shall mean')) {
    return 'definition';
  }
  if (lowerTitle.includes('clause') || lowerTitle.includes('section') || 
      lowerTitle.includes('article') || lowerTitle.includes('term')) {
    return 'clause';
  }
  if (lowerTitle.includes('header') || lowerTitle.includes('title')) {
    return 'header';
  }
  return 'general';
};

// --- CORE LOGIC ---

/**
 * ENHANCEMENT: This function now performs token-aware semantic chunking with legal boundary detection.
 * It splits text by legal boundaries first, then fills chunks to target token size with sentence-level precision.
 * It also captures rich metadata for accurate RAG citations and idempotent upserts.
 */
async function createSemanticChunks(pages: PageData[], filename = ''): Promise<Omit<DocumentChunk, 'document_id' | 'embedding'>[]> {
  if (!pages || pages.length === 0) return [];

  const chunks: Omit<DocumentChunk, 'document_id' | 'embedding'>[] = [];
  let chunkOrder = 1;

  // Detect document-level contract type using first few pages for better signal
  const firstText = pages.slice(0, 5).map(p => p.markdown).join('\n\n');
  const docType = detectContractType(filename, firstText);

  for (const page of pages) {
    const pageNumber = page.index + 1; // Convert 0-index to 1-index for user display
    const content = normalizeText(page.markdown || '');
    if (!content) continue;

    // Split content by legal boundaries
    const sections = legalBoundaries(content);

    for (const section of sections) {
      const lines = section.split('\n');
      const maybeTitle = lines[0]?.replace(/^#+\s*/, '').trim();
      const titleLooksLikeHeader = /^(definitions?|article|section|\d+(\.\d+)*)/i.test(maybeTitle);
      const sectionTitle = titleLooksLikeHeader ? maybeTitle : undefined;
      const body = titleLooksLikeHeader ? lines.slice(1).join('\n') : section;

      if (body.trim().length === 0) continue;

      // Detect contract type from this section
      const sectionType = detectContractType(filename, body) || docType;
      
      // Determine chunk type
      const chunkType = determineChunkType(sectionTitle || '', body);

      // Split body into sentences for fine-grained chunking
      const sentences = sentenceSplit(body);
      let buffer: string[] = [];
      let bufferTokens = 0;

      const pushChunk = async () => {
        if (!buffer.length) return;
        
        const content = buffer.join(' ').trim();
        const hash = await makeHash(content);
        
        chunks.push({
          content,
          chunk_order: chunkOrder++,
          metadata: { 
            page_number: pageNumber, 
            section_title: sectionTitle,
            contract_type: sectionType,
            citation_key: `${pageNumber}_${(sectionTitle || 'Body').replace(/[^a-z0-9]+/gi,'_')}`.slice(0,100),
            chunk_type: chunkType,
            hash
          }
        });
        
        // Create token overlap tail for next chunk
        let overlapTokens = 0;
        const tail: string[] = [];
        for (let i = buffer.length - 1; i >= 0 && overlapTokens < OVERLAP_TOKENS; i--) {
          tail.unshift(buffer[i]);
          overlapTokens += estimateTokens(buffer[i]);
        }
        buffer = tail;
        bufferTokens = tail.reduce((sum, s) => sum + estimateTokens(s), 0);
      };

      for (const sentence of sentences) {
        const sentenceTokens = estimateTokens(sentence);
        
        // If adding this sentence would exceed max tokens, push current chunk
        if (bufferTokens + sentenceTokens > MAX_TOKENS) {
          await pushChunk();
        }
        
        buffer.push(sentence);
        bufferTokens += sentenceTokens;
        
        // If we've reached target tokens, push chunk
        if (bufferTokens >= TARGET_TOKENS) {
          await pushChunk();
        }
      }
      
      // Push any remaining content
      if (buffer.length) {
        await pushChunk();
      }
    }
  }
  
  return chunks;
}

/**
 * ENHANCEMENT: Improved embedding generation with batching, retries, and dimension validation
 */
async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  if (!openaiApiKey) throw new Error('OPENAI_API_KEY is required');
  
  // Batch by token budget to keep payloads sane
  const batches: string[][] = [];
  let currentBatch: string[] = [];
  let currentBatchTokens = 0;
  
  for (const chunk of chunks) {
    const chunkTokens = estimateTokens(chunk);
    
    // If adding this chunk would exceed budget, start new batch
    if (currentBatchTokens + chunkTokens > 150_000 && currentBatch.length) {
      batches.push(currentBatch);
      currentBatch = [];
      currentBatchTokens = 0;
    }
    
    currentBatch.push(chunk);
    currentBatchTokens += chunkTokens;
  }
  
  if (currentBatch.length) {
    batches.push(currentBatch);
  }

  const allEmbeddings: number[][] = [];
  
  for (const batch of batches) {
    let attempt = 1;
    let batchEmbeddings: number[][] = [];
    
    while (true) {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model: EMBEDDING_MODEL, input: batch }),
        });

        if (response.ok) {
          const result = await response.json();
          batchEmbeddings = result.data.map((item: { embedding: number[] }) => item.embedding);
          
          // Validate embedding dimensions
          for (const embedding of batchEmbeddings) {
            if (!Array.isArray(embedding) || embedding.length !== 1536) {
              throw new Error(`Unexpected embedding dimension: ${embedding?.length || 'undefined'}`);
            }
          }
          
          break; // Success, exit retry loop
        }
        
        // Handle rate limiting and server errors with exponential backoff
        if ((response.status === 429 || response.status >= 500) && attempt <= 5) {
          const backoff = Math.min(2000 * Math.pow(2, attempt - 1), 20000) + Math.random() * 250;
          await new Promise(resolve => setTimeout(resolve, backoff));
          attempt++;
          continue;
        }
        
        throw new Error(`OpenAI embeddings failed: ${response.status} ${response.statusText}`);
        
      } catch (error) {
        if (attempt >= 5) throw error;
        // For network errors, retry with exponential backoff
        const backoff = Math.min(2000 * Math.pow(2, attempt - 1), 20000) + Math.random() * 250;
        await new Promise(resolve => setTimeout(resolve, backoff));
        attempt++;
      }
    }
    
    allEmbeddings.push(...batchEmbeddings);
  }
  
  if (allEmbeddings.length !== chunks.length) {
    throw new Error(`Embedding count mismatch: expected ${chunks.length}, got ${allEmbeddings.length}`);
  }
  
  return allEmbeddings;
}

/**
 * ENHANCEMENT: Store chunks with upsert for idempotency
 */
async function storeChunksAndEmbeddings(document_id: string, chunks: Omit<DocumentChunk, 'document_id' | 'embedding'>[], embeddings: number[][]): Promise<void> {
  const chunkRecords = chunks.map((chunk, index) => ({
    document_id,
    ...chunk,
    embedding: embeddings[index],
    hash: chunk.metadata.hash, // Include hash for upsert
  }));

  for (let i = 0; i < chunkRecords.length; i += MAX_CHUNKS_PER_BATCH) {
    const batch = chunkRecords.slice(i, i + MAX_CHUNKS_PER_BATCH);
    
    // Use upsert with conflict resolution on (document_id, hash) for idempotency
    const { error } = await supabase
      .from('document_vectors')
      .upsert(batch, { 
        onConflict: 'document_id,hash', 
        ignoreDuplicates: true 
      });
      
    if (error) throw new Error(`Failed to store document chunks: ${error.message}`);
  }
}

async function updateJobStatus(job_id: string, status: string, output_data: unknown = {}, error_message?: string): Promise<void> {
    const updateData: { status: string; output_data: unknown; completed_at: string; error_message?: string } = { status, output_data, completed_at: new Date().toISOString() };
    if (error_message) updateData.error_message = error_message;
    const { error } = await supabase.from('processing_jobs').update(updateData).eq('id', job_id);
    if (error) throw new Error(`Job update failed: ${error.message}`);
}

async function getJobDetails(job_id: string): Promise<ProcessingJobData> {
    const { data, error } = await supabase
        .from('processing_jobs')
        .select('id, document_id, stage, status, input_data')
        .eq('id', job_id)
        .single();
    if (error) throw new Error(`Failed to get job details for ${job_id}: ${error.message}`);
    return data as ProcessingJobData;
}

async function processEmbeddingJob(job: ProcessingJobData): Promise<void> {
  const startTime = Date.now();
  const now = new Date().toISOString();

  try {
    // ENHANCEMENT: Atomic job status update to prevent double-processing
    const { data: locked, error: lockError } = await supabase
      .from('processing_jobs')
      .update({ status: 'processing', started_at: now })
      .eq('id', job.id)
      .eq('status', 'queued')
      .select('id')
      .single();
      
    if (lockError || !locked) {
      throw new Error('Job already in progress or not queued');
    }

    // Get the page data directly from the job's input
    const pages = job.input_data?.pages;
    if (!pages || pages.length === 0) {
      throw new Error('No pages data found in the job input.');
    }

    // Get document filename for contract type detection
    const { data: document } = await supabase
      .from('documents')
      .select('filename')
      .eq('id', job.document_id)
      .single();
    
    const filename = document?.filename || '';

    const chunks = await createSemanticChunks(pages, filename);
    if (chunks.length === 0) throw new Error('No chunks were created.');

    const contentToEmbed = chunks.map(c => c.content).filter(content => content && content.trim().length > 0);
    
    if (contentToEmbed.length === 0) {
      throw new Error('No valid content to embed - all chunks are empty');
    }
    
    const embeddings = await generateEmbeddings(contentToEmbed);

    await storeChunksAndEmbeddings(job.document_id, chunks, embeddings);
    
    await updateJobStatus(job.id, 'done', {
      completed_at: now,
      processing_time_ms: Date.now() - startTime,
      chunks_count: chunks.length,
    });
    
    // Mark document as completed
    await supabase.from('documents').update({ status: 'completed' }).eq('id', job.document_id);

  } catch (error: unknown) {
    await updateJobStatus(job.id, 'failed', { failed_at: now }, (error as Error).message);
    // Mark document as failed
    try {
      await supabase.from('documents').update({ status: 'failed' }).eq('id', job.document_id);
    } catch {
      // Ignore errors when marking document as failed
    }
  }
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const originHeader = req.headers.get('origin') ?? undefined;
  const headers = { ...buildCorsHeaders(originHeader), 'Content-Type': 'application/json' } as Record<string, string>;

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    const { job_id } = await req.json();
    if (!job_id) throw new Error('job_id is required.');

    const job = await getJobDetails(job_id);

    // ENHANCEMENT: Process synchronously since EdgeRuntime.waitUntil may not exist in Supabase Edge
    // Return 200 when done instead of 202 for fire-and-forget
    await processEmbeddingJob(job);

    return new Response(JSON.stringify({ 
      message: 'Embedding processing completed successfully',
      job_id: job.id,
      chunks_planned: job.input_data?.pages?.length || 0
    }), { status: 200, headers });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Embedding processing error', details: (error as Error).message }),
      { status: 500, headers }
    );
  }
});
