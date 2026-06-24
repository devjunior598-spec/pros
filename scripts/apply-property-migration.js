require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260624_prms_landlord_property_features.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration via RPC exec_sql...');

    try {
        const { error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
            console.error('RPC execution failed:', error.message);
            console.log("If exec_sql is not defined, we'll try to run individual statements or guide the user.");
        } else {
            console.log('Migration applied successfully via RPC!');
        }
    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

applyMigration();
