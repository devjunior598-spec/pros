require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listConversations() {
    const { data, error } = await supabase
        .from('conversations')
        .select(`
            id,
            landlord_id,
            tenant_id
        `);

    if (error) {
        console.error('Error fetching conversations:', error);
    } else {
        console.log('Conversations:', JSON.stringify(data, null, 2));
    }
}

listConversations();
