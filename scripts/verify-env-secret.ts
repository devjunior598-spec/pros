
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local')
    process.exit(1)
}

console.log(`Verifying Service Role Key from .env.local against ${supabaseUrl}...`)

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function test() {
    // Try to list users, which requires service_role permissions
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })

    if (error) {
        console.log('Error authenticating with service role key:', error.message)
        process.exit(1)
    } else {
        console.log('Success! Service Role Key is correctly configured and valid.')
        console.log(`Found ${data.users.length} users (sample).`)
    }
}

test()
