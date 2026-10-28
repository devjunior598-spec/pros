import "server-only";

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const integratedUrl = process.env.SUPABASE_URL;
const supabaseServerKey = integratedUrl === supabaseUrl
    ? process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServerKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY');
}

// Note: This client should ONLY be used in server-side contexts (API routes, Server Actions, etc.)
// NEVER expose this client to the browser.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServerKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
