# B2C Refactor — Task Tracker

## Phase 1 — Init (DB)
- [x] Create-only migration for blank project (`init_b2c.sql`)
- [x] RLS per-user on all user data tables
- [x] RPCs: `start_processing`, `finalize_processing`, `get_credit_summary`
- [x] Storage bucket `documents` + per-user path policies
- [x] Cron GC `gc_expired_holds` (idempotent)

## Phase 2 — Pipeline & Upload/Process Split
- [x] Refactor `ingest_upload_metadata` to create `documents` (status `uploaded`), upload file, no queue
- [x] Add client call to `start_processing(document_id)` and enqueue OCR on `{ok:true}`
- [x] Update `ocr_and_annotation` and `chunk_and_embed` to call `finalize_processing`
- [x] Add small resume helper (RPC: `resume_awaiting_docs`)

## Phase 3 — Stripe
- [x] Create `supabase/functions/stripe-webhooks/index.ts`
- [x] Handle `customer.subscription.created|updated|deleted`
- [x] Handle `invoice.paid` → insert new period in `document_credits`
- [x] Handle `checkout.session.completed` (Doc Credit) → increment `overage_units` and auto-resume
- [x] Expose Customer Portal link endpoint (`stripe-portal`)

## Phase 4 — Frontend
- [x] `Documents.tsx`: user-owned fetching, statuses, Process button
- [x] `Chat.tsx`/`useChatSessions`: user-owned sessions, allow chat after `completed`
- [x] Enhance `UserProfileDialog` as Account: show credit summary, reset date, and open Portal
- [x] Feature flag to hide org UI by default

## Phase 5 — Tests/Acceptance
- [ ] SQL tests for RPCs
- [ ] Integration tests for Stripe webhook
- [ ] Manual acceptance checklist pass


