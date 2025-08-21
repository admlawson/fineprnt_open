import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const DOC_CREDIT_PRICE_ID = Deno.env.get('DOC_CREDIT_PRICE_ID') || 'price_1RwTBQP6dw9IxGJAiqtvn1TE';
const SITE_URL = Deno.env.get('SITE_URL') || 'https://omniclause.com';

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
  // Create a new customer in Stripe
  const res = await fetch('https://api.stripe.com/v1/customers', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ 'metadata[user_id]': userId }).toString()
  });
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
    const { type, quantity } = await req.json().catch(() => ({ type: 'credit', quantity: 1 }));
    if (type !== 'credit') return new Response('Unsupported type', { status: 400, headers: cors });
    if (!DOC_CREDIT_PRICE_ID) throw new Error('Missing DOC_CREDIT_PRICE_ID');
    const customerId = await ensureStripeCustomer(userId);

    // Accept either a price ID or a product ID; if product, fetch default price
    let priceId = DOC_CREDIT_PRICE_ID;
    if (priceId.startsWith('prod_')) {
      const res = await fetch(`https://api.stripe.com/v1/products/${priceId}`, {
        headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` }
      });
      if (!res.ok) throw new Error('Invalid DOC_CREDIT_PRICE_ID (product lookup failed)');
      const json = await res.json();
      priceId = json.default_price || '';
      if (!priceId) throw new Error('Product has no default_price');
      if (typeof priceId !== 'string') priceId = priceId.id;
    }

    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('customer', customerId);
    params.set('success_url', `${SITE_URL}/app/account?purchase=success`);
    params.set('cancel_url', `${SITE_URL}/app/account?purchase=cancelled`);
    params.set('allow_promotion_codes', 'true');
    params.set('line_items[0][price]', priceId);
    params.set('line_items[0][quantity]', String(quantity || 1));
    params.set('metadata[user_id]', userId);
    params.set('metadata[purchase]', 'doc_credit');
    params.set('metadata[quantity]', String(quantity || 1));

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    if (!res.ok) {
      const txt = await res.text();
      return new Response(JSON.stringify({ error: txt }), { status: 400, headers: { 'Content-Type': 'application/json', ...cors } });
    }
    const json = await res.json();
    return new Response(JSON.stringify({ url: json.url }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });
  }
});


