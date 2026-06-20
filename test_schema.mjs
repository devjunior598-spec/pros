import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    console.log("Fetching service providers columns...")
    const { data, error } = await supabase.from('service_providers').select('*').limit(1)
    if (error) {
        console.error("Error:", error)
    } else {
        if (data.length > 0) {
            console.log("Columns:", Object.keys(data[0]))
        } else {
            console.log("Table is empty. Cannot infer columns from data.")
            // Try to insert a dummy to get an error with column info, or just fetch from information_schema
            // but we can't query information_schema from anon key.
        }
    }
}

checkSchema()
