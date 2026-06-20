require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkProfile() {
    const userId = 'f04b4bd3-f534-4b94-9b10-14e6412ab969';
    console.log(`Checking existence of profile for: ${userId}`);

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching profile:', error);
    } else if (data) {
        console.log('Profile FOUND:', JSON.stringify(data, null, 2));
    } else {
        console.log('Profile NOT FOUND. The user exists in Auth but has no Profile record.');
    }
}

checkProfile();
