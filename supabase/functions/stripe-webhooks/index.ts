import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface StripeEvent {
  type: string;
  data: { object: any };
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Optional verification and plan mapping
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';
// Defaults populated from Stripe MCP discovery (non-secret)
const BASIC_PRICE_ID = Deno.env.get('BASIC_PRICE_ID') || 'price_1RwTA1P6dw9IxGJArtXr6mz4';
const PRO_PRICE_ID = Deno.env.get('PRO_PRICE_ID') || 'price_1RwTAlP6dw9IxGJADFkzcbOB';
// Product IDs are intentionally unused now; plan detection is price-ID only

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

async function verifyStripeSignatureIfNeeded(req: Request, rawBody: string): Promise<boolean> {
  if (!STRIPE_WEBHOOK_SECRET) return true;
  const sigHeader = req.headers.get('stripe-signature') || '';
  // Expected format: t=timestamp,v1=signature
  const parts = Object.fromEntries(sigHeader.split(',').map(kv => kv.split('=')) as any);
  const t = parts['t'];
  const v1 = parts['v1'];
  if (!t || !v1) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(STRIPE_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const data = encoder.encode(`${t}.${rawBody}`);
  const mac = await crypto.subtle.sign('HMAC', key, data);
  const expected = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('');
  // Constant-time-ish equality
  if (expected.length !== v1.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
  }
  return result === 0;
}

function periodBounds(invoice: any) {
  const start = new Date((invoice.lines?.data?.[0]?.period?.start || invoice.period_start) * 1000).toISOString();
  const end = new Date((invoice.lines?.data?.[0]?.period?.end || invoice.period_end) * 1000).toISOString();
  return { start, end };
}

async function fetchSubscription(subId: string): Promise<any | null> {
  if (!STRIPE_SECRET_KEY) return null;
  try {
    const resp = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

function getSubscriptionLine(inv: any) {
  const lines = inv?.lines?.data ?? [];
  const byType = lines.find((l: any) => l?.type === 'subscription' || l?.price?.recurring);
  if (byType) return byType;
  const byPriceId = lines.find((l: any) => [BASIC_PRICE_ID, PRO_PRICE_ID].includes((l?.price?.id || '').toString()));
  return byPriceId || lines[0];
}

async function upsertCreditsNoDowngrade(
  userId: string,
  period_start: string,
  period_end: string,
  newStartingCredits: number,
) {
  const { data: existing, error: selErr } = await supabase
    .from('document_credits')
    .select('starting_credits, credits_used, overage_units')
    .eq('user_id', userId)
    .eq('period_start', period_start)
    .maybeSingle();

  const starting_credits = existing ? Math.max(Number(existing.starting_credits || 0), newStartingCredits) : newStartingCredits;

  const { error: upErr } = await supabase
    .from('document_credits')
    .upsert(
      {
        user_id: userId,
        period_start,
        period_end,
        starting_credits,
        credits_used: existing?.credits_used ?? 0,
        overage_units: existing?.overage_units ?? 0,
      },
      { onConflict: 'user_id,period_start' },
    );
  // Consolidate any duplicate rows within the same month bucket into the normalized row
  try {
    const { data: monthRows } = await supabase
      .from('document_credits')
      .select('starting_credits, credits_used, overage_units, period_start')
      .eq('user_id', userId)
      .gte('period_start', period_start)
      .lt('period_start', period_end);
    if (Array.isArray(monthRows) && monthRows.length > 1) {
      const agg = monthRows.reduce(
        (acc: any, r: any) => ({
          starting_credits: Math.max(acc.starting_credits, Number(r.starting_credits || 0)),
          credits_used: Math.max(acc.credits_used, Number(r.credits_used || 0)),
          overage_units: (acc.overage_units + Number(r.overage_units || 0)),
        }),
        { starting_credits, credits_used: existing?.credits_used ?? 0, overage_units: existing?.overage_units ?? 0 },
      );
      await supabase
        .from('document_credits')
        .update({
          starting_credits: agg.starting_credits,
          credits_used: agg.credits_used,
          overage_units: agg.overage_units,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('period_start', period_start);
      await supabase
        .from('document_credits')
        .delete()
        .eq('user_id', userId)
        .gte('period_start', period_start)
        .lt('period_start', period_end)
        .neq('period_start', period_start);
    }
  } catch {}
  try {
    console.log('credits upsert', { userId, period_start, starting_credits, selErr: selErr?.message || null, upErr: upErr?.message || null });
  } catch {}
}

async function handleInvoicePaid(evt: StripeEvent) {
  const invoice = evt.data.object;
  const customerId = invoice.customer as string;
  // Ignore one-time invoices; process only invoices tied to a subscription
  if (!invoice?.subscription) {
    return new Response('ignored-non-subscription', { status: 200 });
  }
  // Fetch subscription for authoritative price and period
  const stripeSub = await fetchSubscription(String(invoice.subscription));
  if (stripeSub) {
    const planKey = resolvePlanKeyFromStripe({ price: stripeSub?.items?.data?.[0]?.price });
    const startingCredits = planKey === 'pro' ? 5 : 1;
    const rawStartIso = toIsoFromStripeTs(stripeSub.current_period_start) || toIsoFromStripeTs(stripeSub.current_period?.start) || new Date().toISOString();
    const { start: period_start, end: period_end } = toMonthBucketBounds(rawStartIso);
    try {
      console.log('resolved plan', {
        src: 'invoice.paid:subscription',
        priceId: stripeSub?.items?.data?.[0]?.price?.id,
        lookup_key: stripeSub?.items?.data?.[0]?.price?.lookup_key,
        planKey,
        startingCredits,
      });
    } catch {}
    // Find user via snapshot table; fallback to invoice line metadata
    const { data: snap } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();
    let targetUserId: string | undefined = snap?.user_id;
    if (!targetUserId) {
      const metaUserId: string | undefined = invoice?.lines?.data?.[0]?.metadata?.user_id;
      if (!metaUserId) return new Response('ignored-missing-user', { status: 200 });
      targetUserId = metaUserId;
    }
    await upsertCreditsNoDowngrade(targetUserId, period_start, period_end, startingCredits);
    await supabase.rpc('resume_awaiting_docs', { p_user_id: targetUserId, p_max: 10 });
    return new Response('ok', { status: 200 });
  }
  // Fallback to invoice line selection
  const subLine = getSubscriptionLine(invoice);
  // Ignore any plan metadata; rely solely on price to avoid stale metadata downgrades
  const planKey = resolvePlanKeyFromStripe({ price: subLine?.price });
  const startingCredits = planKey === 'pro' ? 5 : 1;
  const rawStartIso2 = toIsoFromStripeTs(subLine?.period?.start) || toIsoFromStripeTs(invoice.period_start) || new Date().toISOString();
  const { start: period_start, end: period_end } = toMonthBucketBounds(rawStartIso2);
  try {
    console.log('resolved plan', {
      src: 'invoice.paid:fallback-line',
      priceId: subLine?.price?.id,
      lookup_key: subLine?.price?.lookup_key,
      planKey,
      startingCredits,
    });
  } catch {}
  const { data: snap } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  let targetUserId: string | undefined = snap?.user_id;
  if (!targetUserId) {
    const metaUserId: string | undefined = subLine?.metadata?.user_id || invoice?.lines?.data?.[0]?.metadata?.user_id;
    if (!metaUserId) return new Response('ignored-missing-user', { status: 200 });
    targetUserId = metaUserId;
  }
  await upsertCreditsNoDowngrade(targetUserId, period_start!, period_end!, startingCredits);
  await supabase.rpc('resume_awaiting_docs', { p_user_id: targetUserId, p_max: 10 });
  return new Response('ok', { status: 200 });
}

async function handleSubscriptionUpdated(evt: StripeEvent) {
  const sub = evt.data.object;
  const customerId = sub.customer as string;
  const status = sub.status as string;
  const lineItem = sub.items?.data?.[0];
  // Always resolve from Stripe price; ignore metadata 'plan' to avoid stale downgrades
  const planKey = resolvePlanKeyFromStripe({ price: lineItem?.price });
  try {
    console.log('subscription.updated', {
      priceId: lineItem?.price?.id,
      lookup_key: lineItem?.price?.lookup_key,
      planKey,
    });
  } catch {}
  const rawStartIso = toIsoFromStripeTs(sub.current_period_start) || toIsoFromStripeTs(sub.current_period?.start) || new Date().toISOString();
  const { start: periodStart, end: periodEnd } = toMonthBucketBounds(rawStartIso);
  // Upsert subscription snapshot
  // Prefer subscription.customer mapping or our snapshot; ignore plan metadata for plan resolution
  let userId = sub.metadata?.user_id as string | undefined;
  if (!userId && STRIPE_SECRET_KEY && sub.latest_invoice) {
    try {
      const inv = await fetch(`https://api.stripe.com/v1/invoices/${sub.latest_invoice}`, { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } });
      if (inv.ok) {
        const invJson: any = await inv.json();
        userId = invJson?.lines?.data?.[0]?.metadata?.user_id || undefined;
      }
    } catch {}
  }
  if (!userId) return new Response('ignored-missing-user', { status: 200 });
  await supabase.from('user_subscriptions').upsert({
    user_id: userId,
    plan_key: planKey,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    status,
    current_period_start: periodStart,
    current_period_end: periodEnd
  });
  // Seed/refresh credits for this period on subscription changes as a safety net
  try {
    const startingCredits = planKey === 'pro' ? 5 : 1;
    await upsertCreditsNoDowngrade(userId, periodStart, periodEnd, startingCredits);
    await supabase.rpc('resume_awaiting_docs', { p_user_id: userId, p_max: 10 });
  } catch (_) {}
  return new Response('ok', { status: 200 });
}

async function handleCheckoutCompleted(evt: StripeEvent) {
  const session = evt.data.object;
  const userId = session?.metadata?.user_id as string | undefined;
  const qty = parseInt(session?.metadata?.quantity || '1');
  if (!userId) return new Response('ignored', { status: 200 });

  // One-time Doc Credit purchase
  if (session?.metadata?.purchase === 'doc_credit') {
    const now = new Date();
    const firstOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
    const period_start = firstOfMonth.toISOString();
    const period_end = nextMonth.toISOString();
    // Upsert month bucket; do not reset credits_used if exists
    const { data: existing } = await supabase
      .from('document_credits')
      .select('overage_units')
      .eq('user_id', userId)
      .eq('period_start', period_start)
      .maybeSingle();
    if (existing) {
      await supabase
        .from('document_credits')
        .update({ overage_units: (existing.overage_units || 0) + (isFinite(qty) ? qty : 1), updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('period_start', period_start);
    } else {
      await supabase.from('document_credits').insert({
        user_id: userId,
        period_start,
        period_end,
        starting_credits: 0,
        credits_used: 0,
        overage_units: isFinite(qty) ? qty : 1,
      });
    }
    await supabase.rpc('resume_awaiting_docs', { p_user_id: userId, p_max: 10 });
    return new Response('ok', { status: 200 });
  }

  // Subscription checkout completed: seed current period immediately
  try {
    const subId: string | undefined = session?.subscription as string | undefined;
    if (!subId || !STRIPE_SECRET_KEY) return new Response('ok', { status: 200 });
    const resp = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    });
    if (!resp.ok) return new Response('ok', { status: 200 });
    const sub = await resp.json();
    const customerId = sub.customer as string;
    const status = sub.status as string;
    const rawStartIso = toIsoFromStripeTs(sub.current_period_start) || toIsoFromStripeTs(sub.current_period?.start) || new Date().toISOString();
    const { start: periodStart, end: periodEnd } = toMonthBucketBounds(rawStartIso);
    const planKey = resolvePlanKeyFromStripe({ price: sub.items?.data?.[0]?.price });
    const userIdFromSub: string | undefined = sub.metadata?.user_id || session?.metadata?.user_id;
    const targetUserId = userIdFromSub || userId;
    // Upsert subscription snapshot
    await supabase.from('user_subscriptions').upsert({
      user_id: targetUserId,
      plan_key: planKey,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
    });
    const startingCredits = planKey === 'pro' ? 5 : 1;
    await supabase.from('document_credits').upsert({
      user_id: targetUserId,
      period_start: periodStart,
      period_end: periodEnd,
      starting_credits: startingCredits,
      credits_used: 0,
      overage_units: 0,
    }, { onConflict: 'user_id,period_start' });
    await supabase.rpc('resume_awaiting_docs', { p_user_id: targetUserId, p_max: 10 });
  } catch (_) {}
  return new Response('ok', { status: 200 });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const raw = await req.text();
  const verified = await verifyStripeSignatureIfNeeded(req, raw);
  if (!verified) return new Response('Invalid signature', { status: 400 });
  let event: StripeEvent;
  try {
    event = JSON.parse(raw) as StripeEvent;
  } catch {
    return new Response('Bad Request', { status: 400 });
  }
  switch (event.type) {
    case 'invoice.paid':
      return await handleInvoicePaid(event);
    case 'checkout.session.completed':
      return await handleCheckoutCompleted(event);
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      return await handleSubscriptionUpdated(event);
    default:
      return new Response('ignored', { status: 200 });
  }
});


