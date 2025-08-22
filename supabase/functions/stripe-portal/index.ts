import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

async function getAuthedUserId(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new Error('Missing authorization header');
  const userClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user?.id) throw new Error('Unauthorized');
  return data.user.id;
}

async function createPortal(customerId: string): Promise<string> {
  if (!STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY');
  const returnUrl = (Deno.env.get('SITE_URL') || 'https://fineprnt.com') + '/app/account';
  const form = new URLSearchParams({ customer: customerId, return_url: returnUrl });
  const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form.toString()
  });
  if (!res.ok) throw new Error('Stripe portal creation failed');
  const json = await res.json();
  return json.url;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '*';
  const cors = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  } as Record<string, string>;
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors });
    const userId = await getAuthedUserId(req);
    // Ensure a Stripe customer exists; create on-demand if missing
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: sub } = await admin
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();
    let customerId = sub?.stripe_customer_id as string | undefined;
    if (!customerId) {
      if (!STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY');
      const res = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'metadata[user_id]': userId }).toString()
      });
      if (!res.ok) throw new Error('Failed to create Stripe customer');
      const json = await res.json();
      customerId = json.id as string;
      await admin.from('user_subscriptions').upsert({ user_id: userId, stripe_customer_id: customerId });
    }
    const url = await createPortal(customerId);
    return new Response(JSON.stringify({ url }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });
  }
});


