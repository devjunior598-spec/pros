import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (typeof window !== 'undefined') {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('[Supabase] CRITICAL: Missing environment variables! Check .env.local')
    }
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
        auth: {
            persistSession: true,
            storageKey: 'prms-auth',
        }
    }
)
