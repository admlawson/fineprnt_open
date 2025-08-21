// Centralized helpers for Supabase Edge Function endpoints
// We avoid env variables per platform constraints and reuse the constants.
import { SUPABASE_URL } from './constants';

export const supabaseFunctionsBase = `${SUPABASE_URL}/functions/v1`;
export const functionUrl = (name: string) => `${supabaseFunctionsBase}/${name}`;
