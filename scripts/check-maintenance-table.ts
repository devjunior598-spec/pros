import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTable() {
    console.log('Checking maintenance_requests table...')
    const { data, error } = await supabase
        .from('maintenance_requests')
        .select('count', { count: 'exact', head: true })

    if (error) {
        console.error('Error accessing table:', JSON.stringify(error, null, 2))
        if (error.code === '42P01') {
            console.error('VERDICT: Table does not exist (42P01 undefined_table)')
        }
    } else {
        console.log('Table exists. Count:', data)
    }
}

checkTable()
