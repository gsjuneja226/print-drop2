import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
  global: {
    fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
  },
});

// Admin client bypasses RLS and handles system management tasks from api routes
export const supabaseAdmin = typeof window === 'undefined' && supabaseServiceKey && supabaseServiceKey !== 'placeholder_service_key'
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
      },
    })
  : (typeof window !== 'undefined'
      ? new Proxy({} as any, {
          get(target, prop) {
            throw new Error(`CRITICAL SECURITY ERROR: Cannot access property '${String(prop)}' on supabaseAdmin on the client side.`);
          }
        })
      : supabase);

