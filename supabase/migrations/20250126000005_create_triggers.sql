-- Create database triggers

-- Trigger for documents table to update updated_at timestamp
CREATE TRIGGER t_documents_touch
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION touch_updated_at();

-- Trigger for profiles table to update updated_at timestamp
CREATE TRIGGER t_profiles_touch
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION touch_updated_at();
