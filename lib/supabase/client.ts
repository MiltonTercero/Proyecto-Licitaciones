import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('sample-project') &&
  !supabaseUrl.includes('your-project')
);

export const createBrowserSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
};
