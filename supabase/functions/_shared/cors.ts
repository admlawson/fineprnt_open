export const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8080',
  'https://fineprnt.com',
  'https://www.fineprnt.com',
];

export const baseCorsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

export function buildCorsHeaders(origin?: string) {
  // If origin is provided and is in allowed list, use it
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return {
      ...baseCorsHeaders,
      'Access-Control-Allow-Origin': origin,
    } as Record<string, string>;
  }
  
  // For production, default to the main domain
  const defaultOrigin = 'https://www.fineprnt.com';
  return {
    ...baseCorsHeaders,
    'Access-Control-Allow-Origin': defaultOrigin,
  } as Record<string, string>;
}

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin') ?? undefined;
    return new Response(null, { headers: buildCorsHeaders(origin) });
  }
  return null;
}
