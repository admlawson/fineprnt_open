-- Create tables based on the schema documentation

-- API Rate Limits table
CREATE TABLE public.api_rate_limits (
  user_id uuid NOT NULL,
  bucket text NOT NULL,
  window_start timestamp with time zone NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  CONSTRAINT api_rate_limits_pkey PRIMARY KEY (user_id, bucket, window_start)
);

-- Create index for API rate limits
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window ON public.api_rate_limits USING btree (window_start);

-- Chat Sessions table
CREATE TABLE public.chat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_id uuid NOT NULL,
  title text NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  message_count integer NOT NULL DEFAULT 0,
  CONSTRAINT chat_sessions_pkey PRIMARY KEY (id)
);

-- Chat Messages table
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NULL DEFAULT now(),
  sequence_number integer NOT NULL,
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_role_check CHECK (
    (role = ANY (ARRAY['user'::text, 'assistant'::text]))
  )
);

-- Create unique index for chat messages
CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_messages_session_seq ON public.chat_messages USING btree (session_id, sequence_number);

-- Document Credits table
CREATE TABLE public.document_credits (
  user_id uuid NOT NULL,
  period_start timestamp with time zone NOT NULL,
  period_end timestamp with time zone NOT NULL,
  starting_credits integer NOT NULL,
  credits_used integer NOT NULL DEFAULT 0,
  overage_units integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT document_credits_pkey PRIMARY KEY (user_id, period_start),
  CONSTRAINT credits_bounds CHECK (
    (credits_used <= (starting_credits + overage_units))
  ),
  CONSTRAINT credits_nonneg CHECK (
    ((starting_credits >= 0) AND (credits_used >= 0) AND (overage_units >= 0))
  ),
  CONSTRAINT period_order CHECK ((period_end > period_start))
);

-- Create indexes for document credits
CREATE INDEX IF NOT EXISTS idx_document_credits_user_period_start ON public.document_credits USING btree (user_id, period_start DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_doc_credits ON public.document_credits USING btree (user_id, period_start);

-- Document Credit Holds table
CREATE TABLE public.document_credit_holds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_id uuid NOT NULL,
  period_start timestamp with time zone NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT document_credit_holds_pkey PRIMARY KEY (id),
  CONSTRAINT document_credit_holds_document_id_key UNIQUE (document_id)
);

-- Create index for document credit holds
CREATE INDEX IF NOT EXISTS idx_document_credit_holds_user_expires ON public.document_credit_holds USING btree (user_id, expires_at);

-- Document Usage Log table
CREATE TABLE public.document_usage_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_id uuid NULL,
  event text NOT NULL,
  amount integer NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT document_usage_log_pkey PRIMARY KEY (id),
  CONSTRAINT document_usage_log_event_check CHECK (
    (event = ANY (
      ARRAY[
        'credit_hold_created'::text,
        'credit_hold_released'::text,
        'credit_consumed'::text,
        'credit_refund'::text,
        'overage_recorded'::text
      ]
    ))
  )
);

-- Create index for document usage log
CREATE INDEX IF NOT EXISTS idx_document_usage_log_user_created ON public.document_usage_log USING btree (user_id, created_at DESC);

-- Documents table
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  filename text NOT NULL,
  sha256 text NOT NULL,
  file_size bigint NULL,
  mime_type text NULL,
  storage_path text NULL,
  status text NOT NULL DEFAULT 'uploaded'::text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_user_id_sha256_key UNIQUE (user_id, sha256),
  CONSTRAINT documents_file_size_check CHECK (
    ((file_size > 0) AND (file_size <= 52428800))
  ),
  CONSTRAINT documents_status_check CHECK (
    (status = ANY (
      ARRAY[
        'uploaded'::text,
        'queued'::text,
        'processing'::text,
        'awaiting_credit'::text,
        'completed'::text,
        'failed'::text
      ]
    ))
  )
);

-- Create index for documents
CREATE INDEX IF NOT EXISTS idx_documents_user_status_created ON public.documents USING btree (user_id, status, created_at DESC);

-- Document Text table
CREATE TABLE public.document_text (
  document_id uuid NOT NULL,
  markdown text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT document_text_pkey PRIMARY KEY (document_id)
);

-- Document Vectors table
CREATE TABLE public.document_vectors (
  id bigserial NOT NULL,
  document_id uuid NOT NULL,
  chunk_order integer NOT NULL,
  content text NOT NULL,
  embedding vector NULL,
  page_number integer NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT document_vectors_pkey PRIMARY KEY (id)
);

-- Create indexes for document vectors
CREATE INDEX IF NOT EXISTS idx_document_vectors_doc_chunk ON public.document_vectors USING btree (document_id, chunk_order);
CREATE INDEX IF NOT EXISTS idx_document_vectors_embedding ON public.document_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = '100');

-- Processing Jobs table
CREATE TABLE public.processing_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  stage text NOT NULL,
  status text NOT NULL DEFAULT 'queued'::text,
  input_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text NULL,
  started_at timestamp with time zone NULL,
  completed_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT processing_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT processing_jobs_stage_check CHECK (
    (stage = ANY (
      ARRAY[
        'ingest'::text,
        'ocr'::text,
        'annotation'::text,
        'vectorization'::text,
        'embed'::text,
        'finalize'::text
      ]
    ))
  ),
  CONSTRAINT processing_jobs_status_check CHECK (
    (status = ANY (
      ARRAY[
        'queued'::text,
        'processing'::text,
        'done'::text,
        'failed'::text
      ]
    ))
  )
);

-- Profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  display_name text NULL,
  title text NULL,
  phone text NULL,
  bio text NULL,
  avatar_path text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- Subscription Plans table
CREATE TABLE public.subscription_plans (
  key text NOT NULL,
  docs_included integer NOT NULL,
  CONSTRAINT subscription_plans_pkey PRIMARY KEY (key)
);

-- User Subscriptions table
CREATE TABLE public.user_subscriptions (
  user_id uuid NOT NULL,
  plan_key text NULL,
  stripe_customer_id text NULL,
  stripe_subscription_id text NULL,
  status text NOT NULL,
  current_period_start timestamp with time zone NOT NULL,
  current_period_end timestamp with time zone NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT user_subscriptions_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_subscriptions_stripe_customer_id_key UNIQUE (stripe_customer_id),
  CONSTRAINT user_subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id),
  CONSTRAINT user_subscriptions_status_check CHECK (
    (status = ANY (
      ARRAY[
        'active'::text,
        'past_due'::text,
        'canceled'::text,
        'incomplete'::text
      ]
    ))
  )
);

-- Create view for user credit summary
CREATE VIEW public.v_user_credit_summary AS
  SELECT period_start, period_end, starting_credits, credits_used, overage_units,
         (starting_credits + overage_units - credits_used) as credits_available
  FROM document_credits ORDER BY period_start DESC LIMIT 1;
