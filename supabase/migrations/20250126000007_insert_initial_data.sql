-- Insert initial subscription plans
INSERT INTO public.subscription_plans (key, docs_included) VALUES
  ('trial', 5),
  ('basic', 25),
  ('pro', 100),
  ('enterprise', 1000)
ON CONFLICT (key) DO NOTHING;
