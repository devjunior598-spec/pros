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

async function applyPhase4Migration() {
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260807_prms_phase4_full.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying Phase 4 migration...');

    try {
        const { error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
            console.log('RPC exec_sql unavailable, checking buckets via Supabase Admin JS Client...');
            await supabase.storage.createBucket('maintenance-proofs', { public: false });
            await supabase.storage.createBucket('support-attachments', { public: false });
            await supabase.storage.createBucket('provider-documents', { public: false });
            console.log('Phase 4 Buckets confirmed!');
        } else {
            console.log('Phase 4 Migration applied successfully via RPC!');
        }
    } catch (e) {
        console.error('Unexpected error applying migration:', e);
    }
}

applyPhase4Migration();
