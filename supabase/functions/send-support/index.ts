import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildCorsHeaders, handleCors } from "../_shared/cors.ts";

type Payload = {
  category?: string;
  message: string;
  email?: string;
  user_id?: string;
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
    const { category = 'General', message = '', email = '', user_id = '', path = '' } = payload || {};
    if (!message.trim()) return new Response(JSON.stringify({ error: 'message required' }), { status: 400, headers });

    const supabase = createClient(supabaseUrl, anon, { global: { headers: { Authorization: req.headers.get('Authorization') || '' }}});
    const userRes = await supabase.auth.getUser();
    const authUser = userRes.data.user || null;

    const body = [
      `Category: ${category}`,
      `From: ${email || authUser?.email || 'unknown'}`,
      `User ID: ${user_id || authUser?.id || 'unknown'}`,
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
        from: 'fineprnt Support <support@fineprnt.com>',
        to: ['support@symbianlabs.com'],
        subject: `fineprnt Support — ${category}`,
        text: body
      })
    });

    if (!emailRes.ok) {
      const detail = await emailRes.text();
      throw new Error(`Resend failed: ${detail}`);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'unknown error' }), { status: 500, headers });
  }
}

// Deno.serve entrypoint
// deno-lint-ignore no-explicit-any
((globalThis as any).Deno?.serve) && Deno.serve(handler);


