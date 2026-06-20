
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
    const { data, error } = await supabase.storage.getBucket('properties')
    if (error) {
        console.log('BUCKET_MISSING')
    } else {
        console.log('BUCKET_EXISTS')
    }
}
check()
