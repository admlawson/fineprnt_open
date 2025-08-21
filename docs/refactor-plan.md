## OmniClause B2C Refactor — Execution Plan (Blank Supabase)

### Phase 1 — Init (DB + RLS + RPCs)

Files created/changed:
- `supabase/migrations/20250815123000_init_b2c.sql` (create-only)
  - Extensions: `pgcrypto`, `vector`, `pg_cron`
  - Tables: `subscription_plans`, `user_subscriptions`, `documents`, `document_text`, `document_vectors`, `processing_jobs`, `chat_sessions`, `chat_messages`, `document_credits`, `document_credit_holds`, `document_usage_log`
  - Indexes & RLS: user-scoped for all user data tables
  - Storage: private `documents` bucket + per-user path policies
  - RPCs: `start_processing(document_id)`, `finalize_processing(document_id, success)`, `get_credit_summary()`
  - GC: `gc_expired_holds()` scheduled via `pg_cron`

Cutover impact:
- Frontend can immediately query by `user_id` (implicit via RLS). No org columns present.

### Phase 2 — Pipeline + Upload/Process split

Changes:
- `supabase/functions/01_ingest_upload_metadata/index.ts`
  - Switch to B2C: require auth header, infer `auth.uid()`; remove `org_id` parameter
  - Insert `documents` row: `{ user_id, filename, sha256, status='uploaded' }`
  - Upload file to `documents/<user_id>/<document_id>/<filename>`
  - Do not enqueue jobs automatically

- New server function or UI action calls: `rpc('start_processing', { p_document_id })`
  - If `{ ok: true }` → enqueue OCR job and set doc `queued`
  - Else → show insufficient credits modal

- Update pipeline functions `02_ocr_and_annotation`, `03_chunk_and_embed`
  - Keep same internal logic, but do not set credit states
  - On success/failure, call `rpc('finalize_processing', { p_document_id, p_success })`
  - Ensure service role key is used; respect new table names/columns

### Phase 3 — Stripe (Checkout, Portal, Webhooks)

Files:
- `supabase/functions/stripe-webhooks/index.ts` (new)
  - `customer.subscription.created|updated|deleted`: upsert `user_subscriptions`
  - `invoice.paid`: insert new `document_credits` row for current period: `starting_credits=1|5`, `credits_used=0`, `overage_units=0`
  - `checkout.session.completed` for one-time Doc Credit: increment `overage_units` in current period; auto-resume any `awaiting_credit` docs via `start_processing`
  - Expose signed Customer Portal URL endpoint (or render link in app)

Env vars:
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs for Basic/Pro/Credit
- `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `MISTRAL_API_KEY`

### Phase 4 — Frontend wiring (minimal)

Key edits:
- `src/pages/Documents.tsx`
  - Query `documents` without `org_id`; include statuses: `uploaded|queued|processing|awaiting_credit|completed|failed`
  - Add Process button that calls `start_processing`; handle insufficient credits
  - Show progress and Retry on `failed`

- `src/pages/Chat.tsx`, `src/hooks/useChatSessions.tsx`
  - Create/read `chat_sessions` without `org_id` (user-owned)
  - Only allow chat for `documents.status='completed'`

- `src/contexts/AuthContext.tsx`
  - Make org fields optional or behind feature flag

- New `src/pages/Account.tsx`
  - Show plan, `get_credit_summary()` results, reset date, “Buy one document” and “Manage Billing” (Portal)

Feature flag:
- Hide org UI unless `VITE_ENTERPRISE_ENABLED=true`

### Phase 5 — Tests + Acceptance

Tests (where feasible):
- SQL unit tests for `start_processing`/`finalize_processing`
- Edge function integration tests for Stripe webhook paths (mock events)
- Manual acceptance checklist in this doc

Acceptance checklist:
- Upload doesn’t spend credit; doc `uploaded`
- Process with credit holds then completes; success consumes 1
- Insufficient credits sets `awaiting_credit`; purchase/upgrade auto-resumes
- Period reset creates new `document_credits` row and resets counters
- RLS isolation across users for all tables
- Idempotent finalize; safe on retries
- GC returns expired holds to `uploaded`

### Rollout

1) Apply Phase 1 migration via MCP to new Supabase project
2) Deploy updated edge functions (Phase 2)
3) Configure Stripe, deploy webhooks (Phase 3)
4) Ship frontend changes (Phase 4)
5) Run acceptance checklist


