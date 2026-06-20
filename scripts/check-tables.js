
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('Checking tables...');
    // We can't query information_schema directly easily with supabase-js unless we have a function or use rpc.
    // But we can try to select from them.

    const tables = ['maintenance_requests', 'repair_quotes', 'payments', 'bills', 'reviews', 'request_images'];

    for (const table of tables) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error) {
            console.log(`Table ${table}: Error - ${error.message} (Code: ${error.code})`);
        } else {
            console.log(`Table ${table}: Exists and accessible`);
        }
    }
}

checkTables();
