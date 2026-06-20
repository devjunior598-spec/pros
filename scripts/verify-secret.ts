
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
    console.error('No Supabase URL found in .env.local')
    process.exit(1)
}

if (!serviceRoleKey) {
    console.error('No Supabase service role key found in .env.local')
    process.exit(1)
}

console.log(`Testing service role key against ${supabaseUrl}...`)

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
        console.log('Error authenticating with secret:', error.message)
        // Check if it's a specific "Unauthorized" or "Invalid token" error
    } else {
        console.log('Success! Secret is valid for admin operations.')
        console.log(`Found ${data.users.length} users (sample).`)
    }
}

test()
