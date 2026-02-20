import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ============================================================
// Supabase Client — lazy singleton, shared across all apps
// ============================================================

let _supabase: SupabaseClient<Database> | null = null;

function getSupabase(): SupabaseClient<Database> {
    if (!_supabase) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) {
            throw new Error(
                'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
                'Create a .env.local file with your Supabase credentials.'
            );
        }
        _supabase = createClient<Database>(url, key);
    }
    return _supabase;
}

// Proxy object so existing `supabase.from(...)` calls work seamlessly
export const supabase = new Proxy({} as SupabaseClient<any>, {
    get(_target, prop) {
        return (getSupabase() as any)[prop];
    },
});

// Admin client with service role key (server-side only)
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient<Database>(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}
