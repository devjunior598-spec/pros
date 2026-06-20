require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUserFetch() {
    console.log('Fetching user...');

    // Auth getUser equivalent (need a token really, but can't get easily here without login)
    // Instead, let's just test the profiles fetch which is likelier to fail if schema is wrong
    const testUserId = '0b2c79f2-f449-4a03-b5a7-0a55fa268533'; // Landlord ID

    console.log(`Fetching profile for ${testUserId}...`);

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single();

    if (error) {
        console.error('Profile Fetch Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Profile Data:', JSON.stringify(data, null, 2));
    }

    // Also test service provider fetch if applicable (though logic says only if role matches)
    if (data && data.role === 'service_provider') {
        const { data: provider, error: pError } = await supabase
            .from('service_providers')
            .select('approval_status')
            .eq('user_id', testUserId)
            .maybeSingle();

        if (pError) console.error('Provider Fetch Error:', pError);
        else console.log('Provider Data:', provider);
    }
}

debugUserFetch();
