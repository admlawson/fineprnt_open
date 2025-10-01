import { isMockMode } from './mockMode';

// Check if we're in mock mode first
const mockMode = isMockMode();

// Mock values for demo mode
const MOCK_SUPABASE_URL = 'https://mock.supabase.co';
const MOCK_SUPABASE_ANON_KEY = 'mock-anon-key';

export const SUPABASE_URL = mockMode 
  ? MOCK_SUPABASE_URL 
  : import.meta.env.VITE_SUPABASE_URL;

export const SUPABASE_ANON_KEY = mockMode 
  ? MOCK_SUPABASE_ANON_KEY 
  : import.meta.env.VITE_SUPABASE_ANON_KEY;

export const APP_BASE_URL = import.meta.env.VITE_APP_BASE_URL || "http://localhost:5173";

// Only throw error if not in mock mode and environment variables are missing
if (!mockMode && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
  throw new Error('Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
}
