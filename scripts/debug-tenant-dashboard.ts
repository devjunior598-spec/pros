
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env specific to local dev
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase env vars')
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkTenantData() {
    console.log('--- Checking Tenant Dashboard Data ---')

    // 1. Get a tenant user
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()

    // Note: admin.listUsers might not work with anon key if RLS enabled/no admin rights, 
    // but in local dev usually we can bypass or use service role if available. 
    // Since we don't have service role easily exposed, we'll try to find a user from profiles.

    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'tenant')
        .limit(1)

    if (profileError) {
        console.error('Error fetching profiles:', profileError)
        return
    }

    if (!profiles || profiles.length === 0) {
        console.log('No tenant profiles found.')
        return
    }

    const tenant = profiles[0]
    console.log('Testing with tenant:', tenant.email, tenant.id)
    const userId = tenant.id

    // 2. Test Rentals Query
    console.log('\n[Test] Fetching Rentals...')
    const { data: rentalsData, error: rentalsError } = await supabase
        .from('rentals')
        .select('*, property:properties(*)')
        .eq('tenant_id', userId)

    if (rentalsError) {
        console.error('FAIL: Rentals query failed:', rentalsError)
    } else {
        console.log('SUCCESS: Rentals query. Found:', rentalsData?.length)
        if (rentalsData && rentalsData.length > 0) {
            rentalsData.forEach((r, i) => {
                if (!r.property) {
                    console.error(`ERROR: Rental [${i}] id=${r.id} has NULL property relation! This will crash the dashboard.`)
                } else {
                    console.log(`Rental [${i}] property: ${r.property.title}`)
                }
            })
        } else {
            console.log('No rentals found for this tenant.')
        }
    }
    console.log('--- End of Script ---')

    // 3. Test Wallets Query
    console.log('\n[Test] Fetching Wallets...')
    try {
        const { data: walletData, error: walletError } = await supabase
            .from('wallets')
            .select('balance')
            .eq('tenant_id', userId)
            .maybeSingle()

        if (walletError) {
            console.error('FAIL: Wallet query failed:', walletError)
        } else {
            console.log('SUCCESS: Wallet query. Balance:', walletData?.balance)
        }
    } catch (e) {
        console.error('CRITICAL FAIL: Wallet query crashed:', e)
    }
}

checkTenantData()
