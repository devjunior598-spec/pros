require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugFetch() {
    // Hardcode for reliability during debug
    const landlordId = '0b2c79f2-f449-4a03-b5a7-0a55fa268533';
    console.log('Testing with Landlord ID:', landlordId);

    const { data, error } = await supabase
        .from('rentals')
        .select(`
            tenant_id,
            rent_amount,
            status,
            property:properties (
                title
            ),
            bills (
                payments (amount, status, created_at)
            ),
            tenant:profiles!rentals_tenant_id_fkey (
                name
            )
        `)
        .eq('landlord_id', landlordId)
        .eq('status', 'approved');

    if (error) {
        console.error('Full Error Object:', JSON.stringify(error, null, 2));
    } else {
        console.log('Success! Data:', JSON.stringify(data, null, 2));
    }
}

debugFetch();
