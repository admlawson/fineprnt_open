import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Defaults populated from Stripe MCP discovery (non-secret)
const BASIC_PRICE_ID = Deno.env.get('BASIC_PRICE_ID') || 'price_1RybToP6dw9IxGJAKZILFex3';
const PRO_PRICE_ID = Deno.env.get('PRO_PRICE_ID') || 'price_1RybUxP6dw9IxGJAPrkGr2XH';

function resolvePlanKeyFromStripe(input: { price: any }): 'basic' | 'pro' {
  const price = input?.price || {};
  const lookup = (price?.lookup_key || '').toLowerCase();
  if (lookup === 'pro' || lookup.startsWith('pro')) return 'pro';
  if (lookup === 'basic' || lookup.startsWith('basic')) return 'basic';
  const priceId = (price?.id || '').toLowerCase();
  if (BASIC_PRICE_ID && priceId === BASIC_PRICE_ID.toLowerCase()) return 'basic';
  if (PRO_PRICE_ID && priceId === PRO_PRICE_ID.toLowerCase()) return 'pro';
  const nickname = (price?.nickname || '').toLowerCase();
  return nickname.includes('pro') ? 'pro' : 'basic';
}

function toIsoFromStripeTs(val: any): string | null {
  const n = Number(val);
  if (!Number.isFinite(n) || n <= 0) return null;
  try {
    return new Date(n * 1000).toISOString();
  } catch {
    return null;
  }
}

function toMonthBucketBounds(isoStart: string | null, isoEnd?: string | null): { start: string, end: string } {
  const ref = isoStart ? new Date(isoStart) : new Date();
  const start = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { start: start.toISOString(), end: end.toISOString() };
}

async function syncUserSubscription(userId: string) {
  try {
    // Find the user's Stripe customer ID
    const { data: sub } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!sub?.stripe_customer_id) {
      console.log('No Stripe customer found for user:', userId);
      return { error: 'No Stripe customer found' };
    }

    // Fetch active subscriptions from Stripe
    const resp = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${sub.stripe_customer_id}&status=active`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    });

    if (!resp.ok) {
      console.log('Failed to fetch subscriptions from Stripe:', resp.status);
      return { error: 'Failed to fetch from Stripe' };
    }

    const subscriptions = await resp.json();
    if (!subscriptions.data || subscriptions.data.length === 0) {
      console.log('No active subscriptions found for customer:', sub.stripe_customer_id);
      return { error: 'No active subscriptions' };
    }

    const subscription = subscriptions.data[0]; // Take the first active subscription
    const lineItem = subscription.items?.data?.[0];
    const planKey = resolvePlanKeyFromStripe({ price: lineItem?.price });
    const rawStartIso = toIsoFromStripeTs(subscription.current_period_start) || toIsoFromStripeTs(subscription.current_period?.start) || new Date().toISOString();
    const { start: periodStart, end: periodEnd } = toMonthBucketBounds(rawStartIso);

    console.log('Syncing subscription for user:', userId, 'plan:', planKey, 'status:', subscription.status);

    // Upsert subscription snapshot
    const { error: subError } = await supabase.from('user_subscriptions').upsert({
      user_id: userId,
      plan_key: planKey,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
    });

    if (subError) {
      console.error('Failed to upsert subscription:', subError);
      return { error: 'Failed to update subscription' };
    }

    // Seed credits for this period
    const startingCredits = planKey === 'pro' ? 5 : 1;
    const { error: creditError } = await supabase.from('document_credits').upsert({
      user_id: userId,
      period_start: periodStart,
      period_end: periodEnd,
      starting_credits: startingCredits,
      credits_used: 0,
      overage_units: 0,
    }, { onConflict: 'user_id,period_start' });

    if (creditError) {
      console.error('Failed to upsert credits:', creditError);
      return { error: 'Failed to update credits' };
    }

    console.log('Successfully synced subscription and credits');
    return { success: true, plan: planKey, credits: startingCredits };

  } catch (error) {
    console.error('Error syncing subscription:', error);
    return { error: 'Sync failed' };
  }
}

Deno.serve(async (req: Request) => {
  if (!supabaseServiceKey) {
    return new Response('Missing SUPABASE_SERVICE_ROLE_KEY', { status: 500 });
  }

  const origin = req.headers.get('origin') || '*';
  const cors = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  } as Record<string, string>;

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors });

    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Missing authorization header', { status: 401, headers: cors });

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data, error } = await userClient.auth.getUser();
    if (error || !data?.user?.id) return new Response('Unauthorized', { status: 401, headers: cors });

    const userId = data.user.id;
    const result = await syncUserSubscription(userId);

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...cors } 
      });
    }

    return new Response(JSON.stringify(result), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', ...cors } 
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'error' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json', ...cors } 
    });
  }
});
