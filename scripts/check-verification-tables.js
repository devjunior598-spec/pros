const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVerificationTables() {
    const tables = ['landlord_kyc', 'property_verifications', 'tenant_kyc'];
    for (const table of tables) {
        const { error, data } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`Table ${table}: Error - ${error.message} (Code: ${error.code})`);
        } else {
            console.log(`Table ${table}: Exists and is accessible. Data:`, data);
        }
    }
}

checkVerificationTables();
