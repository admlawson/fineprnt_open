import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const SITE_URL = Deno.env.get('SITE_URL') || 'https://www.fineprnt.com';

// Defaults, can be overridden via env
// Align defaults with webhook plan mapping; prefer env when available
const BASIC_PRICE_ID = Deno.env.get('BASIC_PRICE_ID') || 'price_1RybToP6dw9IxGJAKZILFex3';
const PRO_PRICE_ID = Deno.env.get('PRO_PRICE_ID') || 'price_1RzO4AP6dw9IxGJAsyq372fc';

async function getAuthedUserId(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new Error('Missing authorization header');
  const userClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user?.id) throw new Error('Unauthorized');
  return data.user.id;
}

async function ensureStripeCustomer(userId: string): Promise<string> {
  const admin = createClient(supabaseUrl, serviceKey);
  const { data: sub } = await admin
    .from('user_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (sub?.stripe_customer_id) return sub.stripe_customer_id;
  if (!STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY');
  const res = await fetch('https://api.stripe.com/v1/customers', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ 'metadata[user_id]': userId }).toString()
  });
  if (!res.ok) throw new Error('Failed to create Stripe customer');
  const json = await res.json();
  const customerId = json.id as string;
  await admin.from('user_subscriptions').upsert({ user_id: userId, stripe_customer_id: customerId });
  return customerId;
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
    if (!STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY');
    const userId = await getAuthedUserId(req);
    const { plan } = await req.json().catch(() => ({ plan: 'basic' }));

    const priceId = plan === 'pro' ? PRO_PRICE_ID : BASIC_PRICE_ID;
    const customerId = await ensureStripeCustomer(userId);

    // If already subscribed, consider redirect to portal
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: existing } = await admin
      .from('user_subscriptions')
      .select('status, stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (existing?.status === 'active' && existing?.stripe_customer_id) {
      // Create portal session instead
      const formPortal = new URLSearchParams({ customer: existing.stripe_customer_id, return_url: `${SITE_URL}/app/account` });
      const resp = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formPortal.toString(),
      });
      const j = await resp.json();
      return new Response(JSON.stringify({ url: j.url }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
    }

    const form = new URLSearchParams();
    form.set('mode', 'subscription');
    form.set('customer', customerId);
    form.set('success_url', `${SITE_URL}/app/account?sub=success`);
    form.set('cancel_url', `${SITE_URL}/app/account?sub=cancelled`);
    form.set('allow_promotion_codes', 'true');
    form.set('line_items[0][price]', priceId);
    form.set('line_items[0][quantity]', '1');
    form.set('metadata[user_id]', userId);
    form.set('metadata[plan]', plan === 'pro' ? 'pro' : 'basic');
    // Ensure downstream subscription events have user_id available
    form.set('subscription_data[metadata][user_id]', userId);
    form.set('subscription_data[metadata][plan]', plan === 'pro' ? 'pro' : 'basic');
    // Do not set customer_email when customer is provided to avoid Stripe API conflicts

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    const json = await res.json();
    if (!res.ok) return new Response(JSON.stringify({ error: json?.error?.message || 'stripe_error' }), { status: 400, headers: { 'Content-Type': 'application/json', ...cors } });
    return new Response(JSON.stringify({ url: json.url }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });
  }
});


