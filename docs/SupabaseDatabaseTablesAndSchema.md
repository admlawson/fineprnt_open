api_rate_limits
create table public.api_rate_limits (
  user_id uuid not null,
  bucket text not null,
  window_start timestamp with time zone not null,
  request_count integer not null default 0,
  constraint api_rate_limits_pkey primary key (user_id, bucket, window_start)
) TABLESPACE pg_default;

create index IF not exists idx_api_rate_limits_window on public.api_rate_limits using btree (window_start) TABLESPACE pg_default;

chat_messages
create table public.chat_messages (
  id uuid not null default gen_random_uuid (),
  session_id uuid not null,
  role text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  sequence_number integer not null,
  constraint chat_messages_pkey primary key (id),
  constraint chat_messages_session_id_fkey foreign KEY (session_id) references chat_sessions (id) on delete CASCADE,
  constraint chat_messages_role_check check (
    (
      role = any (array['user'::text, 'assistant'::text])
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists uq_chat_messages_session_seq on public.chat_messages using btree (session_id, sequence_number) TABLESPACE pg_default;

chat_sessions
create table public.chat_sessions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  document_id uuid not null,
  title text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  message_count integer not null default 0,
  constraint chat_sessions_pkey primary key (id),
  constraint chat_sessions_document_id_fkey foreign KEY (document_id) references documents (id) on delete CASCADE,
  constraint chat_sessions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_chat_sessions_user_doc_created on public.chat_sessions using btree (user_id, document_id, created_at desc) TABLESPACE pg_default;

document_credit_holds
create table public.document_credit_holds (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  document_id uuid not null,
  period_start timestamp with time zone not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone null default now(),
  constraint document_credit_holds_pkey primary key (id),
  constraint document_credit_holds_document_id_key unique (document_id),
  constraint document_credit_holds_document_id_fkey foreign KEY (document_id) references documents (id) on delete CASCADE,
  constraint document_credit_holds_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_document_credit_holds_user_expires on public.document_credit_holds using btree (user_id, expires_at) TABLESPACE pg_default;

document_credits
create table public.document_credits (
  user_id uuid not null,
  period_start timestamp with time zone not null,
  period_end timestamp with time zone not null,
  starting_credits integer not null,
  credits_used integer not null default 0,
  overage_units integer not null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint document_credits_pkey primary key (user_id, period_start),
  constraint document_credits_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint credits_bounds check (
    (
      credits_used <= (starting_credits + overage_units)
    )
  ),
  constraint credits_nonneg check (
    (
      (starting_credits >= 0)
      and (credits_used >= 0)
      and (overage_units >= 0)
    )
  ),
  constraint period_order check ((period_end > period_start))
) TABLESPACE pg_default;

create index IF not exists idx_document_credits_user_period_start on public.document_credits using btree (user_id, period_start desc) TABLESPACE pg_default;

create unique INDEX IF not exists uniq_doc_credits on public.document_credits using btree (user_id, period_start) TABLESPACE pg_default;

document_text
create table public.document_text (
  document_id uuid not null,
  markdown text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  constraint document_text_pkey primary key (document_id),
  constraint document_text_document_id_fkey foreign KEY (document_id) references documents (id) on delete CASCADE
) TABLESPACE pg_default;

document_usage_log
create table public.document_usage_log (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  document_id uuid null,
  event text not null,
  amount integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  constraint document_usage_log_pkey primary key (id),
  constraint document_usage_log_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint document_usage_log_event_check check (
    (
      event = any (
        array[
          'credit_hold_created'::text,
          'credit_hold_released'::text,
          'credit_consumed'::text,
          'credit_refund'::text,
          'overage_recorded'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_document_usage_log_user_created on public.document_usage_log using btree (user_id, created_at desc) TABLESPACE pg_default;

document_vectors
create table public.document_vectors (
  id bigserial not null,
  document_id uuid not null,
  chunk_order integer not null,
  content text not null,
  embedding extensions.vector null,
  page_number integer null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  constraint document_vectors_pkey primary key (id),
  constraint document_vectors_document_id_fkey foreign KEY (document_id) references documents (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_document_vectors_doc_chunk on public.document_vectors using btree (document_id, chunk_order) TABLESPACE pg_default;

create index IF not exists idx_document_vectors_embedding on public.document_vectors using ivfflat (embedding extensions.vector_cosine_ops)
with
  (lists = '100') TABLESPACE pg_default;

  documents
  create table public.documents (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  filename text not null,
  sha256 text not null,
  file_size bigint null,
  mime_type text null,
  storage_path text null,
  status text not null default 'uploaded'::text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint documents_pkey primary key (id),
  constraint documents_user_id_sha256_key unique (user_id, sha256),
  constraint documents_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint documents_file_size_check check (
    (
      (file_size > 0)
      and (file_size <= 52428800)
    )
  ),
  constraint documents_status_check check (
    (
      status = any (
        array[
          'uploaded'::text,
          'queued'::text,
          'processing'::text,
          'awaiting_credit'::text,
          'completed'::text,
          'failed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_documents_user_status_created on public.documents using btree (user_id, status, created_at desc) TABLESPACE pg_default;

create trigger t_documents_touch BEFORE
update on documents for EACH row
execute FUNCTION touch_updated_at ();

processing_jobs
create table public.processing_jobs (
  id uuid not null default gen_random_uuid (),
  document_id uuid not null,
  stage text not null,
  status text not null default 'queued'::text,
  input_data jsonb not null default '{}'::jsonb,
  output_data jsonb not null default '{}'::jsonb,
  error_message text null,
  started_at timestamp with time zone null,
  completed_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint processing_jobs_pkey primary key (id),
  constraint processing_jobs_document_id_fkey foreign KEY (document_id) references documents (id) on delete CASCADE,
  constraint processing_jobs_stage_check check (
    (
      stage = any (
        array[
          'ingest'::text,
          'ocr'::text,
          'annotation'::text,
          'vectorization'::text,
          'embed'::text,
          'finalize'::text
        ]
      )
    )
  ),
  constraint processing_jobs_status_check check (
    (
      status = any (
        array[
          'queued'::text,
          'processing'::text,
          'done'::text,
          'failed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

profiles
create table public.profiles (
  id uuid not null,
  display_name text null,
  title text null,
  phone text null,
  bio text null,
  avatar_path text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger t_profiles_touch BEFORE
update on profiles for EACH row
execute FUNCTION touch_updated_at ();

subscription_plans
create table public.subscription_plans (
  key text not null,
  docs_included integer not null,
  constraint subscription_plans_pkey primary key (key)
) TABLESPACE pg_default;

user_subscriptions
create table public.user_subscriptions (
  user_id uuid not null,
  plan_key text null,
  stripe_customer_id text null,
  stripe_subscription_id text null,
  status text not null,
  current_period_start timestamp with time zone not null,
  current_period_end timestamp with time zone not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_subscriptions_pkey primary key (user_id),
  constraint user_subscriptions_stripe_customer_id_key unique (stripe_customer_id),
  constraint user_subscriptions_stripe_subscription_id_key unique (stripe_subscription_id),
  constraint user_subscriptions_plan_key_fkey foreign KEY (plan_key) references subscription_plans (key),
  constraint user_subscriptions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint user_subscriptions_status_check check (
    (
      status = any (
        array[
          'active'::text,
          'past_due'::text,
          'canceled'::text,
          'incomplete'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

v_user_credit_summary
