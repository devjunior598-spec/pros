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
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260624150000_prms_rent_payment_system.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying rent payment system migration...');

    try {
        const { error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
            console.error('RPC execution failed (function might not exist):', error.message);
            console.log("Please copy the content of 'supabase/migrations/20260624150000_prms_rent_payment_system.sql' and run it manually in your Supabase SQL Editor.");
        } else {
            console.log('Migration applied successfully via RPC!');
        }
    } catch (e) {
        console.error('Unexpected error:', e);
        console.log("Please run 'supabase/migrations/20260624150000_prms_rent_payment_system.sql' manually.");
    }
}

applyMigration();
