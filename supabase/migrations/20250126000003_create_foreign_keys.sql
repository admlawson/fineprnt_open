-- Add foreign key constraints

-- Chat Sessions foreign keys
ALTER TABLE public.chat_sessions 
  ADD CONSTRAINT chat_sessions_document_id_fkey 
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;

ALTER TABLE public.chat_sessions 
  ADD CONSTRAINT chat_sessions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Chat Messages foreign keys
ALTER TABLE public.chat_messages 
  ADD CONSTRAINT chat_messages_session_id_fkey 
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE;

-- Document Credits foreign keys
ALTER TABLE public.document_credits 
  ADD CONSTRAINT document_credits_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Document Credit Holds foreign keys
ALTER TABLE public.document_credit_holds 
  ADD CONSTRAINT document_credit_holds_document_id_fkey 
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;

ALTER TABLE public.document_credit_holds 
  ADD CONSTRAINT document_credit_holds_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Document Usage Log foreign keys
ALTER TABLE public.document_usage_log 
  ADD CONSTRAINT document_usage_log_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Document Text foreign keys
ALTER TABLE public.document_text 
  ADD CONSTRAINT document_text_document_id_fkey 
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;

-- Document Vectors foreign keys
ALTER TABLE public.document_vectors 
  ADD CONSTRAINT document_vectors_document_id_fkey 
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;

-- Processing Jobs foreign keys
ALTER TABLE public.processing_jobs 
  ADD CONSTRAINT processing_jobs_document_id_fkey 
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;

-- Profiles foreign keys
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User Subscriptions foreign keys
ALTER TABLE public.user_subscriptions 
  ADD CONSTRAINT user_subscriptions_plan_key_fkey 
  FOREIGN KEY (plan_key) REFERENCES subscription_plans(key);

ALTER TABLE public.user_subscriptions 
  ADD CONSTRAINT user_subscriptions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
