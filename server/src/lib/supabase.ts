import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY; // optional

if (!url || !anon) {
  throw new Error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)');
}

// Public client (RLS enforced)
export const supabase = createClient(url, anon);

// Privileged client (ONLY used server-side when service role key supplied)
let serviceClient: SupabaseClient | null = null;
if (service) {
  serviceClient = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });
}

export function getServiceClient() {
  return serviceClient;
}
