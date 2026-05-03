import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials missing! Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
} else {
  console.log('🚀 Supabase client initializing with URL:', supabaseUrl);
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'sb-ulaijcibgenbblwawvdq-auth-token' // Consistent key
    }
  }
);

// Basic check to report connection status in dev console
if (supabaseUrl && supabaseAnonKey) {
  console.log('📡 Testing Supabase connection...');
  supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1)
    .then(({ error, count }) => {
      if (error) {
        if (error.message.includes('FetchError') || error.message.includes('Failed to fetch')) {
          console.error('❌ Supabase Connection Failed: Network error. Check URL and Internet.');
        } else if (error.code === '42P01') {
          console.warn('⚠️ Supabase Connected, but "profiles" table not found yet. Run the schema.sql in your Supabase SQL Editor.');
        } else if (error.code === 'PGRST301') {
          console.error('❌ Supabase API Key Error: The provided Anon Key is invalid.');
        } else {
          console.error('❌ Supabase initial connection error:', error.message);
        }
      } else {
        console.log('✅ Supabase connected successfully! Connectivity confirmed.');
      }
    });
}
