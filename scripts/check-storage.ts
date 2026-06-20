
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

const envResult = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
if (envResult.error) console.error('Error loading .env.local', envResult.error)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function checkStorage() {
    console.log(`Checking storage at ${supabaseUrl}...`)

    // List all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
        console.error('Error listing buckets:', error.message)
        process.exit(1)
    }

    console.log('Buckets found:', buckets.map(b => b.name))

    const propertiesBucket = buckets.find(b => b.name === 'properties')
    if (propertiesBucket) {
        console.log("✅ 'properties' bucket exists.")
    } else {
        console.log("❌ 'properties' bucket MISSING. You may need to create it.")
    }
}

checkStorage()
