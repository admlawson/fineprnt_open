import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildCorsHeaders, handleCors } from '../_shared/cors.ts';

// Corrected Imports with static strings and forced dependency versions
import { Mistral } from 'https://esm.sh/@mistralai/mistralai@1.7.4?deps=zod@3.23.8';
import { z } from 'https://esm.sh/zod@3.23.8';
import { responseFormatFromZodObject } from 'https://esm.sh/@mistralai/mistralai@1.7.4/extra/structChat.js?deps=zod@3.23.8';

// --- INTERFACES ---

// The result from the Mistral API, containing pages and annotations
interface OCRResult {
  pages: Array<{ index: number; markdown: string }>;
  document_annotation?: any;
  bbox_annotations?: any[];
  original_metadata?: any;
}

// Supabase - Interface for the job data
interface ProcessingJobData {
  id: string;
  document_id: string;
  stage: string;
  status: string;
  input_data: any;
}

// Document details from the 'documents' table
interface DocumentDetails {
  storage_path: string;
  filename: string;
  mime_type: string;
}

// --- INITIALIZATION ---
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- ZOD SCHEMAS for Annotation Pass ---
const BBoxAnnotationSchemaZod = z.object({
  image_type: z.string().describe("The type of content detected in the bbox (chart, table, signature, diagram, etc.)"),
  description: z.string().describe("A detailed description of the content in this bbox"),
  extracted_text: z.string().describe("Any text content extracted from this bbox"),
  relevance: z.string().describe("Relevance of this content to the document type (high, medium, low, none)")
});

const DocumentAnnotationSchemaZod = z.object({
  document_type: z.string().describe("Type of document (contract, agreement, policy, lease, employment, financial, etc.)"),
  contract_category: z.string().optional().describe("Specific contract category if applicable (real estate, medical, employment, etc.)"),
  key_sections: z.array(z.string()).describe("Important section headers and titles found in the document"),
  compliance_indicators: z.array(z.string()).describe("Potential compliance-related terms or clauses identified"),
  payment_terms: z.array(z.string()).describe("Payment-related terms, rates, or conditions mentioned"),
  effective_dates: z.array(z.string()).describe("Important dates mentioned (effective dates, expiration, etc.)"),
  parties_involved: z.array(z.string()).describe("Organizations, entities, or parties mentioned in the document"),
  // Healthcare-specific fields (optional for backward compatibility)
  medical_relevance: z.string().optional().describe("Healthcare/medical relevance of this content (high, medium, low, none)"),
  healthcare_indicators: z.array(z.string()).optional().describe("Healthcare-specific terms or compliance indicators")
});

// --- CORE LOGIC ---

async function pollForOCRJobs(): Promise<ProcessingJobData[]> {
  const { data, error } = await supabase
    .from('processing_jobs')
    .select('id, document_id, stage, status, input_data, created_at')
    .eq('stage', 'ocr')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(5);
  if (error) throw new Error(`Failed to poll jobs: ${error.message}`);
  return data || [];
}

async function getDocumentDetails(document_id: string): Promise<DocumentDetails> {
  const { data, error } = await supabase
    .from('documents')
    .select('storage_path, filename, mime_type')
    .eq('id', document_id)
    .single();
  if (error) throw new Error(`Document fetch failed: ${error.message}`);
  return data as DocumentDetails;
}

/**
 * ENHANCEMENT: Implements a two-pass OCR strategy.
 * Pass 1: Gets the full, raw text from all pages of the document.
 * Pass 2: Gets structured JSON annotations from the first 8 pages.
 */
async function processWithMistralOCR(document: DocumentDetails): Promise<OCRResult> {
  if (!mistralApiKey) throw new Error('MISTRAL_API_KEY environment variable is required');

  const [bucketName, ...pathParts] = document.storage_path.split('/');
  const filePath = pathParts.join('/');
  
  const { data: fileBlob, error: downloadError } = await supabase.storage.from(bucketName).download(filePath);
  if (downloadError) throw new Error(`Failed to download file: ${downloadError.message}`);
  
  const fileContent = await fileBlob.arrayBuffer();

  const mistralClient = new Mistral({ apiKey: mistralApiKey });
  
  console.log(`Uploading file to Mistral: ${document.filename}, size: ${fileContent.byteLength} bytes`);
  const uploadedFile = await mistralClient.files.upload({
    file: { fileName: document.filename, content: fileContent },
    purpose: "ocr"
  });
  console.log(`File uploaded with ID: ${uploadedFile.id}`);

  if (!uploadedFile?.id) {
    throw new Error(`File upload failed - no file ID returned`);
  }

  // Verify file was uploaded successfully
  const fileInfo = await mistralClient.files.retrieve({ fileId: uploadedFile.id });
  console.log(`File verified: ${fileInfo.filename}, size: ${fileInfo.size_bytes} bytes`);

  const signedUrl = await mistralClient.files.getSignedUrl({ fileId: uploadedFile.id });
  console.log(`Signed URL obtained for file ${uploadedFile.id}`);

  if (!signedUrl?.url) {
    throw new Error(`Signed URL generation failed - no URL returned`);
  }

  // Add delay to ensure file is fully processed on Mistral's end
  console.log('Waiting for file to be ready...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // --- Pass 1: Full Text Extraction with Retry Logic ---
  console.log(`Starting OCR Pass 1: Full text extraction for ${document.filename}`);
  let fullTextResponse: any;
  let lastError: any;
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`OCR attempt ${attempt}/3`);
      fullTextResponse = await mistralClient.ocr.process({
        model: "mistral-ocr-latest",
        document: { type: "document_url", documentUrl: signedUrl.url }
      });
      
      if (fullTextResponse.pages && fullTextResponse.pages.length > 0) {
        console.log(`Pass 1 successful: extracted ${fullTextResponse.pages.length} pages`);
        break;
      } else {
        throw new Error(`Mistral OCR returned no pages`);
      }
    } catch (error: any) {
      lastError = error;
      console.error(`OCR attempt ${attempt} failed:`, error.message);
      
      if (attempt < 3) {
        console.log(`Waiting ${attempt * 2} seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
  }
  
  if (!fullTextResponse || !fullTextResponse.pages || fullTextResponse.pages.length === 0) {
    throw new Error(`Mistral OCR failed after 3 attempts. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  // --- Pass 2: Annotation Extraction (First 8 Pages) ---
  let annotationResult: any = {};
  try {
    const annotationResponse = await mistralClient.ocr.process({
      model: "mistral-ocr-latest",
      document: { type: "document_url", documentUrl: signedUrl.url },
      pages: Array.from({ length: 8 }, (_, i) => i),
      documentAnnotationFormat: responseFormatFromZodObject(DocumentAnnotationSchemaZod),
      includeImageBase64: true
    });
    annotationResult = annotationResponse;
  } catch (error) {
    annotationResult = {};
  }
  
  // --- Return combined results ---
  return {
    pages: fullTextResponse.pages || [],
    document_annotation: annotationResult.document_annotation || null,
    bbox_annotations: annotationResult.bbox_annotations || [],
    original_metadata: fullTextResponse.metadata || {},
  };
}

/**
 * NEW: This function only stores the annotations and other metadata.
 * The full text is passed directly to the next function.
 */
async function updateDocumentWithOCRMetadata(document_id: string, ocrResult: OCRResult): Promise<void> {
    const metadataUpdate = {
        ocr_processed_at: new Date().toISOString(),
        mistral_version: "mistral-ocr-latest",
        page_count: ocrResult.pages.length,
        document_annotation: ocrResult.document_annotation,
        bbox_annotations: ocrResult.bbox_annotations,
    };

    const { error } = await supabase
        .from('documents')
        .update({ metadata: metadataUpdate })
        .eq('id', document_id);

    if (error) {
        throw new Error(`Failed to update document metadata: ${error.message}`);
    }
}

async function updateJobStatus(job_id: string, status: string, output_data: any = {}, error_message?: string): Promise<void> {
  const updateData: any = { status, output_data, completed_at: new Date().toISOString() };
  if (error_message) updateData.error_message = error_message;
  const { error } = await supabase.from('processing_jobs').update(updateData).eq('id', job_id);
  if (error) throw new Error(`Job update failed: ${error.message}`);
}

/**
 * ENHANCEMENT: This function now accepts the raw pages array to pass to the next stage.
 */
async function enqueueEmbeddingJob(document_id: string, pages: any[]): Promise<string> {
  const { data, error } = await supabase
    .from('processing_jobs')
    .insert({ 
      document_id, 
      stage: 'embed', 
      status: 'queued', 
      // Pass the pages data directly to the next function's job record
      input_data: { pages, source_stage: 'ocr' } 
    })
    .select('id')
    .single();
  if (error) throw new Error(`Failed to enqueue embedding job: ${error.message}`);
  return data.id;
}

async function processOCRJob(job: ProcessingJobData): Promise<void> {
  const startTime = Date.now();

  try {
    await updateJobStatus(job.id, 'processing', { started_at: new Date().toISOString() });
    // reflect processing state on the document
    await supabase.from('documents').update({ status: 'processing' }).eq('id', job.document_id);

    const document = await getDocumentDetails(job.document_id);
    const ocrResult = await processWithMistralOCR(document);
    
    // Store annotations in 'documents' table, not the full text
    await updateDocumentWithOCRMetadata(job.document_id, ocrResult);
    
    await updateJobStatus(job.id, 'done', {
      completed_at: new Date().toISOString(),
      processing_time_ms: Date.now() - startTime,
      page_count: ocrResult.pages.length,
    });
    
    // Pass the full pages array to the next stage
    const nextJobId = await enqueueEmbeddingJob(job.document_id, ocrResult.pages);
    
    const { error: invokeError } = await supabase.functions.invoke('chunk_and_embed', {
      body: { job_id: nextJobId }
    });
    if (invokeError) throw new Error(`Error triggering embedding function: ${invokeError.message}`);
    
  } catch (error: any) {
    await updateJobStatus(job.id, 'failed', {
      failed_at: new Date().toISOString(),
      processing_time_ms: Date.now() - startTime
    }, error.message);
    // release hold and mark failed atomically via RPC
    try {
      await supabase.rpc('finalize_processing', { p_document_id: job.document_id, p_success: false });
    } catch (_) {}
  }
}

async function processQueuedJobs(): Promise<void> {
  try {
    const jobs = await pollForOCRJobs();
    if (jobs.length === 0) return;
    for (const job of jobs) {
      try {
        await processOCRJob(job);
      } catch (error) {
        // Job-specific error already handled in processOCRJob
      }
    }
  } catch (error) {
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const originHeader = req.headers.get('origin') ?? undefined;
  const headers = { ...buildCorsHeaders(originHeader), 'Content-Type': 'application/json' } as Record<string, string>;

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  const response = new Response(JSON.stringify({ message: 'OCR processing triggered' }), { status: 202, headers });
  // @ts-ignore
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
    // @ts-ignore
    EdgeRuntime.waitUntil(processQueuedJobs());
  } else {
    processQueuedJobs().catch(error => console.error('Background job processing failed:', error));
  }
  return response;
});
