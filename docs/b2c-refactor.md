## Goal

Pivot omniclause from org-centric B2B to **B2C per-user** subscriptions with Stripe. Keep data isolation, but remove org-first flows from the default path.

## Plans & gates

* **Basic — \$40/mo** → **1 document** / month, **unlimited chat**
* **Pro — \$60/mo** → **5 documents** / month, **unlimited chat**
* **Overage — \$12 per extra document** (unlimited chat)
* No free trial. “Contact Sales” for Enterprise.

**Upgrade nudge:** On Basic, 3 docs = \$40 + 2×\$12 = \$64 → *Pro is cheaper at \$60*.

## Vendors & costs (context only)

* **OCR**: Mistral `mistral-ocr-latest` — \$1/1k pages + \$3/1k pages annotations
* **Embeddings**: OpenAI `text-embedding-3-small` — \$0.01 / 1M tokens
* **Chat**: OpenAI **gpt-5** — input \$1.25/M, cached input \$0.125/M, output \$10/M
* **Infra**: Supabase \$50/mo, Vercel \$40/mo

---

## Product changes (B2C-first)

1. **User-first ownership**

   * Users sign up, pay, upload docs, and chat.
   * Keep org features behind an Enterprise feature flag.

2. **Processing-based credit consumption (robust UX)**

   * **Upload is free**: create the doc and store the file; **do not** spend credits.
   * When the user clicks **Process** (or auto-process), we:

     * **Attempt to reserve (hold) one credit** for this document.
     * If hold succeeds → enqueue pipeline (OCR → annotate → chunk → embed).
     * On **success** → **finalize** the hold (consume the credit) and **activate chat**.
     * On **failure/cancel** → release the hold; **no credit consumed**.
   * If no credits are available at process-time:

     * Set doc/status to **`awaiting_credit`** and show modal: **Upgrade to Pro** or **Buy one document (\$12)**.
     * After purchase/upgrade, **auto-resume**: place hold, start processing.

3. **Unlimited chat** (with guardrails)

   * Per-response token cap + streaming; allow “expand” on demand.
   * Retrieval caching and short-term context caching to keep gpt-5 costs low.

4. **Stripe**

   * Two recurring prices (Basic/Pro).
   * Overage as **one-time “Doc Credit”** product **or** **metered usage** (“documents” at \$12/unit).
   * Webhooks drive entitlements (period resets, status changes) and wake `awaiting_credit` docs.

5. **Enterprise**

   * Keep org tables/invites; hide behind feature flag and “Contact Sales”.

---

## Deliverables

* Schema migrations for **per-user subs**, **credit holds**, **consumption**, and **usage logs**.
* Stripe Checkout/Portal + webhooks that **reset credits** each period and **resume processing** of `awaiting_credit` docs.
* API: `start_processing(document_id)`, `finalize_processing(document_id, success)`.
* Upload/Process UX with upgrade/overage modals.
* RLS policies for per-user isolation.
* Backfill scripts for existing org data.

## Non-goals

* No free trials; no per-message pricing; don’t delete org tables.

## Acceptance tests

* **Upload** never consumes credit; `documents.status='uploaded'`.
* **Process with credit**: creates **hold**, runs pipeline, **consumes on success**, activates chat.
* **Process without credit**: doc → `awaiting_credit`; upgrade/credit purchase resumes automatically.
* **Failure path**: pipeline failure releases hold; no credit consumed; user can re-process.
* **Period reset** via Stripe webhook resets included credits; `awaiting_credit` docs re-check and run if possible.
* RLS: user can only see their own docs/sessions/credits/usage.
* Upgrades/downgrades prorate correctly; credits reset at new period start.

---

## What must change (and why)

1. **Ownership model** (org-first → user-first)
   Add `user_id` to documents/sessions and make `org_id` optional so personal accounts are the default.

2. **Entitlements & consumption**
   Need **per-period credits** and **credit holds** to bill only on successful processing while preventing compute abuse.

3. **Upload/Process split**
   Upload creates doc; **Process** initiates compute. This matches “charge only when processed”.

4. **Stripe-driven state**
   Webhooks must update plan, period, and credits; and trigger **auto-resume** of stuck docs.

5. **RLS overhaul**
   All user content must be scoped by `auth.uid()`.

---

## Plan (schema, migrations, APIs, UI)

### A) Database changes (Supabase / Postgres)

**New tables**

```sql
-- Plans
create table public.subscription_plans (
  key text primary key,             -- 'basic' | 'pro'
  docs_included int not null        -- 1 or 5
);

-- Per-user subscription & period
create table public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_key text references public.subscription_plans(key),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null check (status in ('active','past_due','canceled','incomplete')),
  current_period_start timestamptz not null,
  current_period_end   timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Monthly credit bucket (resets each period)
create table public.document_credits (
  user_id uuid references auth.users(id) on delete cascade,
  period_start timestamptz not null,
  period_end   timestamptz not null,
  starting_credits int not null,    -- included (1 or 5)
  credits_used int not null default 0,
  overage_units int not null default 0, -- extra credits
  primary key (user_id, period_start)
);

-- Credit holds (reservations during processing)
create table public.document_credit_holds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  period_start timestamptz not null,
  expires_at timestamptz not null,  -- e.g., now() + interval '2 hours'
  created_at timestamptz default now(),
  unique (document_id)              -- one hold per doc
);

-- Usage log (immutable)
create table public.document_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  document_id uuid references public.documents(id),
  event text not null check (event in ('credit_hold_created','credit_hold_released','credit_consumed','credit_refund','overage_recorded')),
  amount int not null default 1,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
```

**Alter existing to be user-first + new statuses**

```sql
-- Documents: add user_id; org_id optional; richer statuses
alter table public.documents
  add column user_id uuid references auth.users(id),
  alter column org_id drop not null,
  alter column status drop default,
  alter table public.documents
    add constraint documents_status_check
    check (status in ('uploaded','queued','processing','awaiting_credit','completed','failed'));

-- Backfill user_id from organizations.owner_id where possible (one-time script).

-- Chat sessions: add user_id; org_id optional
alter table public.chat_sessions
  add column user_id uuid references auth.users(id),
  alter column org_id drop not null;
```

**RLS (examples)**

```sql
alter table public.documents enable row level security;
create policy user_owns_docs on public.documents
  for all using (user_id = auth.uid());

alter table public.chat_sessions enable row level security;
create policy user_owns_sessions on public.chat_sessions
  for all using (user_id = auth.uid());

alter table public.document_credits enable row level security;
create policy user_owns_credits on public.document_credits
  for all using (user_id = auth.uid());

alter table public.document_credit_holds enable row level security;
create policy user_owns_holds on public.document_credit_holds
  for all using (user_id = auth.uid());

alter table public.document_usage_log enable row level security;
create policy user_reads_own_usage on public.document_usage_log
  for select using (user_id = auth.uid());
create policy user_writes_own_usage on public.document_usage_log
  for insert with check (user_id = auth.uid());
```

### B) Server functions (RPC) & pipeline enforcement

**Upload flow**

* `POST /documents/upload` → create row with `status='uploaded'`; store file. **No credit touched**.

**Processing flow**

* `POST /documents/:id/process`

  1. **Try to create a credit hold**:

     * Compute **available = starting\_credits + overage\_units - credits\_used - active\_holds** for current period.
     * If `available > 0` → insert row into `document_credit_holds` (expires in \~2h), log `credit_hold_created`, set doc `status='queued'`.
     * Else → set doc `status='awaiting_credit'`, return `{ status: 'insufficient_credits' }`.
  2. Enqueue pipeline job.

* Pipeline worker:

  * Set `status='processing'` while running.
  * On **success** → call `finalize_processing(document_id, success=true)`.
  * On **failure** → `finalize_processing(document_id, success=false)`.

**Finalize**

```sql
-- Pseudocode behavior:
-- success=true:
--   - find hold; increment document_credits.credits_used by 1 (same period)
--   - delete hold; log credit_consumed; set documents.status='completed'; enable chat
-- success=false:
--   - delete hold if exists; log credit_hold_released; set status='failed'
```

**Stripe interactions**

* **Overage as one-time credit**: `checkout.session.completed` → increment `overage_units` for current period and **wake** any `awaiting_credit` docs (place hold & queue).
* **Metered usage alternative**: instead of one-time credits, report `usage_record` to Stripe at finalize-success; still keep internal holds to prevent compute abuse.

**Hold GC**

* Cron to release expired holds (e.g., job crashed) and set doc back to `uploaded`.

### C) UI/UX changes

* **Upload screen**: after upload → “Ready to process” with current credits and reset date.
* **Process button (primary CTA)**:

  * If hold created → show “Analyzing…”; allow cancel (releases hold).
  * If insufficient credits → modal:

    * **Upgrade to Pro**
    * **Buy one document (\$12)**
    * Cancel
* **Document cards**:

  * `uploaded` (idle), `queued/processing` (progress), `awaiting_credit` (badge + CTA), `completed` (chat enabled), `failed` (retry CTA).
* **Account**: plan card, credit counter, reset date, “Buy one document”, link to Stripe Portal.

### D) Stripe setup

* Products/Prices:

  * Subscription (Basic \$40/mo, Pro \$60/mo)
  * Overage: **either** One-time “Doc Credit \$12” **or** Metered “Documents \$12/unit”
* Webhooks:

  * `customer.subscription.created|updated`: upsert plan/status/period
  * `invoice.paid`: (re)set `document_credits` row (starting=1 or 5; used=0; overage=0)
  * `customer.subscription.deleted|payment_failed`: update status; optionally freeze new processing
  * `checkout.session.completed` (credit purchase): increment `overage_units`; wake `awaiting_credit` docs

### E) Migration steps

1. Create new tables: `subscription_plans`, `user_subscriptions`, `document_credits`, `document_credit_holds`, `document_usage_log`.
2. Alter `documents`/`chat_sessions` to add `user_id`, make `org_id` optional, extend `status`.
3. Backfill `user_id` where possible (from `organizations.owner_id` or migration mapping).
4. Enable RLS policies.
5. Seed `subscription_plans` (`basic:1`, `pro:5`).
6. Implement Stripe products/prices and webhooks.
7. Build `start_processing` & `finalize_processing` logic; integrate holds.
8. Update UI (Upload/Process, modals, badges, account page).
9. QA against Acceptance tests.

---

## Implementation notes (B2C init hardening)

- Concurrency-safe holds: `start_processing` now locks the current period row (`FOR UPDATE`) and subtracts active holds to compute `available` before inserting a new hold. It also validates doc status: only `uploaded|failed|awaiting_credit` are eligible.
- Grants: explicitly granted execute on `start_processing`, `finalize_processing`, and `get_credit_summary` to `authenticated`.
- Cron idempotency: scheduling of `gc_expired_holds` is wrapped to unschedule/reschedule safely if re-run.
- Quality-of-life: `touch_updated_at` trigger on `documents`, and unique `(session_id, sequence_number)` for `chat_messages`.