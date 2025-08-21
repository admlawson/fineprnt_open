-- Note: RLS policies will be enabled after auth is properly configured
-- For now, we'll comment them out to avoid auth.uid() references

/*
-- Create RLS policies

-- API Rate Limits policies
CREATE POLICY "api_rate_limits_owner" ON public.api_rate_limits
  FOR ALL USING (auth.uid() = user_id);

-- Chat Messages policies
CREATE POLICY "chat_messages_owner" ON public.chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.session_id
      AND cs.user_id = auth.uid()
    )
  );

-- Chat Sessions policies
CREATE POLICY "chat_sessions_owner" ON public.chat_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Document Credit Holds policies
CREATE POLICY "holds_owner" ON public.document_credit_holds
  FOR ALL USING (auth.uid() = user_id);

-- Document Credits policies
CREATE POLICY "credits_owner" ON public.document_credits
  FOR ALL USING (auth.uid() = user_id);

-- Document Text policies
CREATE POLICY "document_text_owner" ON public.document_text
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_text.document_id
      AND d.user_id = auth.uid()
    )
  );

-- Document Usage Log policies
CREATE POLICY "usage_log_read" ON public.document_usage_log
  FOR SELECT USING (auth.uid() = user_id);

-- Document Vectors policies
CREATE POLICY "document_vectors_owner" ON public.document_vectors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_vectors.document_id
      AND d.user_id = auth.uid()
    )
  );

-- Documents policies
CREATE POLICY "documents_delete" ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "documents_insert" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents_select" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "documents_update" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id);

-- Processing Jobs policies
CREATE POLICY "processing_jobs_select" ON public.processing_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = processing_jobs.document_id
      AND d.user_id = auth.uid()
    )
  );

-- Profiles policies
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Subscription Plans policies
CREATE POLICY "subscription_plans_read" ON public.subscription_plans
  FOR SELECT USING (true);

-- User Subscriptions policies
CREATE POLICY "user_subscriptions_owner" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
*/
