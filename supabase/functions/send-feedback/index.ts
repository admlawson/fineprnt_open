// @ts-expect-error - Deno environment types not available
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildCorsHeaders, handleCors } from "../_shared/cors.ts";

// Deno type declarations
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

type Payload = {
  category?: string;
  message: string;
  email?: string;
  path?: string;
}

const cors = {
  build(origin?: string) {
    return {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Content-Type': 'application/json'
    } as Record<string,string>;
  }
}

export default async function handler(req: Request) {
  const headers = cors.build(req.headers.get('origin') || undefined);
  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) throw new Error('RESEND_API_KEY not set');

    const payload = await req.json() as Payload;
    const { category = 'General', message = '', email = '', path = '' } = payload || {};
    if (!message.trim()) return new Response(JSON.stringify({ error: 'message required' }), { status: 400, headers });

    const body = [
      `Category: ${category}`,
      `From: ${email || 'anonymous'}`,
      `Path: ${path || 'n/a'}`,
      '',
      message
    ].join('\n');

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'fineprnt Feedback <feedback@fineprnt.com>',
        to: ['support@symbianlabs.com'],
        subject: `fineprnt Feedback — ${category}`,
        text: body
      })
    });

    if (!emailRes.ok) {
      const detail = await emailRes.text();
      throw new Error(`Resend failed: ${detail}`);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: (err as Error)?.message || 'unknown error' }), { status: 500, headers });
  }
}

// Deno.serve entrypoint
// @ts-expect-error - Deno types not available
if ((globalThis as { Deno?: { serve?: unknown } }).Deno?.serve) {
  Deno.serve(handler);
}


