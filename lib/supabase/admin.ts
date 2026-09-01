import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function getEnvVar(name: string): string {
  if (process.env[name]) return process.env[name]!;

  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const k = trimmed.slice(0, idx).trim();
          const v = trimmed.slice(idx + 1).trim();
          if (k === name) return v;
        }
      }
    }
  } catch {}
  return '';
}

export const getSupabaseConfig = () => {
  const rawUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || '';
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const supabaseServiceKey =
    getEnvVar('SUPABASE_SERVICE_ROLE_KEY') || getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || '';

  return { supabaseUrl, supabaseServiceKey };
};

export const isSupabaseConfigured = () => {
  const { supabaseUrl, supabaseServiceKey } = getSupabaseConfig();
  return Boolean(
    supabaseUrl &&
    supabaseServiceKey &&
    !supabaseUrl.includes('sample-project') &&
    !supabaseUrl.includes('your-project')
  );
};

export const createAdminSupabaseClient = () => {
  const { supabaseUrl, supabaseServiceKey } = getSupabaseConfig();
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
