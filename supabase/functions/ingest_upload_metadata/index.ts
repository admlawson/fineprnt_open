
// @ts-expect-error - Deno environment types not available
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildCorsHeaders, handleCors } from '../_shared/cors.ts';

// Deno type declarations
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

interface UploadRequest {
  file: File;
}

interface UploadResponse {
  document_id: string;
  status: 'duplicate' | 'uploaded';
  duplicate?: boolean;
  metadata?: unknown;
}

interface DuplicateInfo {
  document_id: string;
  filename: string;
  created_at: string;
  status: string;
}

// Initialize Supabase client with service role for admin operations
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Create client with service role - bypasses RLS for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Supported file types
const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/tiff'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

async function generateSHA256(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

async function checkDuplicateWithMetadata(supabase: unknown, sha256: string, user_id: string): Promise<DuplicateInfo | null> {
  const { data, error } = await (supabase as { from: (table: string) => { select: (fields: string) => { eq: (field: string, value: string) => { maybeSingle: () => Promise<{ data: unknown; error: unknown }> } } } }).from('documents')
    .select('id, filename, created_at, status')
    .eq('sha256', sha256)
    .maybeSingle();

  if (error) {
    throw new Error(`Duplicate check failed: ${(error as { message: string }).message}`);
  }

  if (!data) {
    return null;
  }

  return {
    document_id: (data as { id: string }).id,
    filename: (data as { filename: string }).filename,
    created_at: (data as { created_at: string }).created_at,
    status: (data as { status: string }).status
  };
}

// Validate file content beyond just MIME type
async function validateFileContent(file: File): Promise<void> {
  if (file.size === 0) {
    throw new Error('File is empty');
  }
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  if (file.type === 'application/pdf') {
    const pdfSignature = new TextDecoder().decode(bytes.slice(0, 4));
    if (pdfSignature !== '%PDF') throw new Error('Invalid PDF file format');
  } else if (file.type === 'image/jpeg') {
    if (bytes[0] !== 0xFF || bytes[1] !== 0xD8 || bytes[2] !== 0xFF) throw new Error('Invalid JPEG file format');
  } else if (file.type === 'image/png') {
    if (bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4E || bytes[3] !== 0x47) throw new Error('Invalid PNG file format');
  }
}

async function uploadToStorage(supabase: unknown, file: File, user_id: string, document_id: string, filename: string): Promise<string> {
  const bucketName = 'documents';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${user_id}/${document_id}/${timestamp}-${sanitizedFilename}`;

  const { data, error } = await (supabase as { storage: { from: (bucket: string) => { upload: (path: string, file: File, options: unknown) => Promise<{ data: { path: string } | null; error: unknown }> } } }).storage
    .from(bucketName)
    .upload(storagePath, file, { contentType: file.type, upsert: false, cacheControl: '3600' });

  if (error) throw new Error(`Upload failed: ${(error as { message: string }).message}`);
  return `${bucketName}/${(data as { path: string }).path}`;
}

async function insertDocument(
  supabase: unknown,
  user_id: string,
  document_id: string,
  filename: string,
  sha256: string,
  file_size: number,
  mime_type: string,
  storage_path: string
): Promise<string> {
  let content_category = 'document';
  if (mime_type.startsWith('image/')) content_category = 'image';

  const metadata = {
    content_category,
    original_filename: filename,
    extension: filename.split('.').pop()?.toLowerCase() || '',
    upload_timestamp: new Date().toISOString(),
    processing_version: '1.0'
  };

  const { data, error } = await (supabase as { from: (table: string) => { insert: (data: unknown) => { select: (fields: string) => { single: () => Promise<{ data: unknown; error: unknown }> } } } })
    .from('documents')
    .insert({
      id: document_id,
      filename,
      sha256,
      file_size,
      mime_type,
      storage_path,
      status: 'uploaded',
      metadata
    })
    .select('id')
    .single();

  if (error) {
    const errorObj = error as { code?: string; constraint?: string; message?: string };
    if (errorObj.code === '23505' && (errorObj.constraint?.includes('sha256') || errorObj.message?.includes('duplicate'))) {
      throw new Error('DUPLICATE_FILE');
    }
    if (errorObj.code === '23514' && errorObj.constraint === 'documents_status_check') {
      throw new Error('INVALID_STATUS');
    }
    throw new Error(`Database insert failed: ${errorObj.message || 'Unknown error'}`);
  }

  return (data as { id: string }).id;
}

// No authentication needed - using a default user ID
function getDefaultUserId(): string {
  return '00000000-0000-0000-0000-000000000000';
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const originHeader = req.headers.get('origin') ?? undefined;
  const responseHeaders = { ...buildCorsHeaders(originHeader), 'Content-Type': 'application/json' } as Record<string, string>;

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: responseHeaders });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'Missing required field: file' }), { status: 400, headers: responseHeaders });
    }

    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Unsupported file type', supported_types: SUPPORTED_MIME_TYPES }), { status: 400, headers: responseHeaders });
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'File too large', max_size: MAX_FILE_SIZE, actual_size: file.size }), { status: 400, headers: responseHeaders });
    }

    const user_id = getDefaultUserId();

    try {
      await validateFileContent(file);
    } catch (validationError: unknown) {
      return new Response(JSON.stringify({ error: 'File validation failed', details: (validationError as Error).message }), { status: 400, headers: responseHeaders });
    }

    const sha256 = await generateSHA256(file);

    const duplicateInfo = await checkDuplicateWithMetadata(supabase, sha256, user_id);
    if (duplicateInfo) {
      return new Response(JSON.stringify({
        document_id: duplicateInfo.document_id,
        status: 'duplicate',
        duplicate: true,
        metadata: {
          original_filename: duplicateInfo.filename,
          upload_date: duplicateInfo.created_at,
          current_status: duplicateInfo.status,
          message: `This file was already uploaded as "${duplicateInfo.filename}" on ${new Date(duplicateInfo.created_at).toLocaleDateString()}`
        }
      } as UploadResponse), { status: 409, headers: responseHeaders });
    }

    const document_id = crypto.randomUUID();
    const storage_path = await uploadToStorage(supabase, file, user_id, document_id, file.name);

    try {
      const insertedId = await insertDocument(supabase, user_id, document_id, file.name, sha256, file.size, file.type, storage_path);
      if (!insertedId) throw new Error('Failed to insert document');
    } catch (insertError: unknown) {
      try {
        await supabase.storage.from('documents').remove([storage_path.replace('documents/', '')]);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file after database error:', cleanupError);
      }

      if ((insertError as Error).message === 'DUPLICATE_FILE') {
        const existingDup = await checkDuplicateWithMetadata(supabase, sha256, user_id);
        if (existingDup) {
          return new Response(JSON.stringify({
            document_id: existingDup.document_id,
            status: 'duplicate',
            duplicate: true,
            metadata: {
              original_filename: existingDup.filename,
              upload_date: existingDup.created_at,
              current_status: existingDup.status,
              message: `This file was already uploaded as "${existingDup.filename}"`
            }
          } as UploadResponse), { status: 409, headers: responseHeaders });
        }
      }
      throw insertError;
    }

    return new Response(JSON.stringify({ document_id, status: 'uploaded' } as UploadResponse), { status: 202, headers: responseHeaders });
  } catch (error: unknown) {
    console.error('Upload error:', error);
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    if ((error as Error).message.includes('File validation failed')) {
      statusCode = 400; errorMessage = 'File validation error';
    } else if ((error as Error).message.includes('Duplicate check failed')) {
      statusCode = 500; errorMessage = 'Database error during duplicate check';
    } else if ((error as Error).message.includes('Upload failed')) {
      statusCode = 500; errorMessage = 'Storage upload error';
    } else if ((error as Error).message.includes('authorization') || (error as Error).message.includes('token')) {
      statusCode = 401; errorMessage = 'Unauthorized';
    } else if ((error as Error).message === 'DUPLICATE_FILE') {
      statusCode = 409; errorMessage = 'Duplicate file detected';
    } else if ((error as Error).message === 'INVALID_STATUS') {
      statusCode = 500; errorMessage = 'Database constraint violation';
    }
    return new Response(JSON.stringify({ error: errorMessage, details: (error as Error).message, timestamp: new Date().toISOString() }), { status: statusCode, headers: responseHeaders });
  }
});
