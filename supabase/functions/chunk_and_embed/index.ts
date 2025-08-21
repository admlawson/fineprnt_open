import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildCorsHeaders, handleCors } from '../_shared/cors.ts';

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

// ENHANCEMENT: The chunk now includes rich metadata for citations
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
  }
}

// --- INITIALIZATION ---
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- CONSTANTS ---
const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHUNK_SIZE_WORDS = 400; // Target chunk size in words
const CHUNK_OVERLAP_WORDS = 50; // Overlap in words to maintain context
const MAX_CHUNKS_PER_BATCH = 100; // How many chunks to insert into the DB at once

// --- CORE LOGIC ---

/**
 * ENHANCEMENT: This function now performs semantic chunking with contract type detection.
 * It splits text by sections and then by paragraphs to create more meaningful chunks.
 * It also captures page and section metadata for accurate RAG citations.
 */
function createSemanticChunks(pages: PageData[]): Omit<DocumentChunk, 'document_id' | 'embedding'>[] {
  if (!pages || pages.length === 0) return [];

  const chunks: Omit<DocumentChunk, 'document_id' | 'embedding'>[] = [];
  let chunkOrder = 1;

  // Contract type detection keywords
  const contractTypeKeywords = {
    realestate: ['lease', 'rental', 'property', 'tenant', 'landlord', 'real estate', 'real property'],
    medical: ['medical', 'healthcare', 'provider', 'patient', 'treatment', 'diagnosis', 'prescription'],
    employment: ['employment', 'employee', 'employer', 'work', 'job', 'salary', 'benefits'],
    financial: ['loan', 'credit', 'mortgage', 'interest', 'payment', 'debt', 'financial'],
    legal: ['legal', 'attorney', 'lawyer', 'court', 'litigation', 'legal counsel'],
    insurance: ['insurance', 'policy', 'coverage', 'claim', 'premium', 'deductible'],
    technology: ['software', 'license', 'technology', 'API', 'intellectual property', 'source code'],
    construction: ['construction', 'contractor', 'project', 'building', 'work order', 'specifications'],
    manufacturing: ['manufacturing', 'production', 'supply', 'quality', 'inventory', 'delivery'],
    transportation: ['transportation', 'shipping', 'delivery', 'logistics', 'carrier', 'freight']
  };

  // Detect contract type from content
  const detectContractType = (content: string): string => {
    const lowerContent = content.toLowerCase();
    for (const [type, keywords] of Object.entries(contractTypeKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return type;
      }
    }
    return 'general';
  };

  for (const page of pages) {
    const pageNumber = page.index + 1; // Convert 0-index to 1-index for user display
    const content = page.markdown;

    // Split content by major headings (e.g., # Section, ## Subsection)
    const sections = content.split(/(?=^#+\s)/m).filter(s => s.trim().length > 0);

    for (const section of sections) {
      const lines = section.split('\n');
      const sectionTitle = lines[0].replace(/^#+\s/, '').trim();
      const sectionContent = lines.slice(1).join('\n').trim();

      if (sectionContent.length === 0) continue;

      // Detect contract type from this section
      const contractType = detectContractType(sectionContent);
      
      // Determine chunk type based on section content
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

      const chunkType = determineChunkType(sectionTitle, sectionContent);

      const paragraphs = sectionContent.split('\n\n').filter(p => p.trim().length > 0);
      let currentChunkContent = '';

      for (const paragraph of paragraphs) {
        const paragraphWords = paragraph.split(/\s+/).length;
        const currentChunkWords = currentChunkContent.split(/\s+/).length;

        if (currentChunkWords + paragraphWords > CHUNK_SIZE_WORDS && currentChunkContent) {
          chunks.push({
            content: currentChunkContent,
            chunk_order: chunkOrder++,
            metadata: { 
              page_number: pageNumber, 
              section_title: sectionTitle,
              contract_type: contractType,
              citation_key: `${pageNumber}_${sectionTitle.replace(/[^a-zA-Z0-9]/g, '_')}`,
              chunk_type: chunkType
            }
          });
          // Create overlap for the next chunk
          const words = currentChunkContent.split(/\s+/);
          currentChunkContent = words.slice(words.length - CHUNK_OVERLAP_WORDS).join(' ');
        }
        currentChunkContent += (currentChunkContent ? '\n\n' : '') + paragraph;
      }

      // Add the final chunk for the section if it has content
      if (currentChunkContent) {
        chunks.push({
          content: currentChunkContent,
          chunk_order: chunkOrder++,
          metadata: { 
            page_number: pageNumber, 
            section_title: sectionTitle,
            contract_type: contractType,
            citation_key: `${pageNumber}_${sectionTitle.replace(/[^a-zA-Z0-9]/g, '_')}`,
            chunk_type: chunkType
          }
        });
      }
    }
  }
  return chunks;
}


async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  if (!openaiApiKey) throw new Error('OPENAI_API_KEY is required');
  
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: chunks }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embeddings failed: ${await response.text()}`);
  }

  const result = await response.json();
  return result.data.map((item: any) => item.embedding);
}

async function storeChunksAndEmbeddings(document_id: string, chunks: Omit<DocumentChunk, 'document_id' | 'embedding'>[], embeddings: number[][]): Promise<void> {
  const chunkRecords = chunks.map((chunk, index) => ({
    document_id,
    ...chunk,
    embedding: embeddings[index],
  }));

  for (let i = 0; i < chunkRecords.length; i += MAX_CHUNKS_PER_BATCH) {
    const batch = chunkRecords.slice(i, i + MAX_CHUNKS_PER_BATCH);
    const { error } = await supabase.from('document_vectors').insert(batch);
    if (error) throw new Error(`Failed to store document chunks: ${error.message}`);
  }
}

async function updateJobStatus(job_id: string, status: string, output_data: any = {}, error_message?: string): Promise<void> {
    const updateData: any = { status, output_data, completed_at: new Date().toISOString() };
    if (error_message) updateData.error_message = error_message;
    const { error } = await supabase.from('processing_jobs').update(updateData).eq('id', job_id);
    if (error) throw new Error(`Job update failed: ${error.message}`);
}

async function getJobDetails(job_id: string): Promise<ProcessingJobData> {
    const { data, error } = await supabase
        .from('processing_jobs')
        .select('*, document:documents(*)')
        .eq('id', job_id)
        .single();
    if (error) throw new Error(`Failed to get job details for ${job_id}: ${error.message}`);
    return data as ProcessingJobData;
}

async function processEmbeddingJob(job: ProcessingJobData): Promise<void> {
  const startTime = Date.now();

  try {
    await updateJobStatus(job.id, 'processing', { started_at: new Date().toISOString() });

    // Get the page data directly from the job's input
    const pages = job.input_data?.pages;
    if (!pages || pages.length === 0) {
      throw new Error('No pages data found in the job input.');
    }

    const chunks = createSemanticChunks(pages);
    if (chunks.length === 0) throw new Error('No chunks were created.');

    const contentToEmbed = chunks.map(c => c.content);
    const embeddings = await generateEmbeddings(contentToEmbed);

    await storeChunksAndEmbeddings(job.document_id, chunks, embeddings);
    
    await updateJobStatus(job.id, 'done', {
      completed_at: new Date().toISOString(),
      processing_time_ms: Date.now() - startTime,
      chunks_count: chunks.length,
    });
    
    // finalize: success true (consume hold + set completed)
    await supabase.rpc('finalize_processing', { p_document_id: job.document_id, p_success: true });

  } catch (error: any) {
    await updateJobStatus(job.id, 'failed', { failed_at: new Date().toISOString() }, error.message);
    // finalize: failure (release hold + set failed)
    try {
      await supabase.rpc('finalize_processing', { p_document_id: job.document_id, p_success: false });
    } catch (_) {}
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

    // Don't wait for the processing to finish, run it in the background
    // @ts-ignore
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(processEmbeddingJob(job));
    } else {
      processEmbeddingJob(job).catch(() => {
        // Error already handled in processEmbeddingJob
      });
    }

    return new Response(JSON.stringify({ message: 'Embedding processing started' }), { status: 202, headers });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Embedding processing error', details: (error as Error).message }),
      { status: 500, headers }
    );
  }
});
