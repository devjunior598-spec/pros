
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    console.log('Testing tenant fetch...');
    // We need a landlord_id. I'll pick a dummy one or try to fetch without filtering to see if the select logic itself fails
    // But the query filters by landlord_id. 
    // Let's first just try to select 1 rental with all those joins

    const { data, error } = await supabase
        .from('rentals')
        .select(`
            tenant_id,
            rent_amount,
            status,
            property:properties (
                title
            ),
            payments (amount, status, created_at),
            tenant:profiles (
                name
            )
        `)
        .limit(1);

    if (error) {
        console.error('Error fetching:', JSON.stringify(error, null, 2));
    } else {
        console.log('Success!', data);
    }
}

testFetch();
