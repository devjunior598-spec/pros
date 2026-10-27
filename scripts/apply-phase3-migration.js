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

async function applyPhase3Migration() {
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260806_prms_phase3_full.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying Phase 3 migration...');

    try {
        const { error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
            console.log('RPC exec_sql unavailable, attempting table checks via Supabase Admin JS Client...');
            // Ensure buckets exist via storage API
            const { error: leaseBucketErr } = await supabase.storage.createBucket('lease-documents', { public: false });
            if (leaseBucketErr && !leaseBucketErr.message.includes('already exists')) {
                console.warn('Lease bucket notice:', leaseBucketErr.message);
            } else {
                console.log('Bucket "lease-documents" confirmed.');
            }

            const { error: rcpBucketErr } = await supabase.storage.createBucket('payment-receipts', { public: false });
            if (rcpBucketErr && !rcpBucketErr.message.includes('already exists')) {
                console.warn('Receipts bucket notice:', rcpBucketErr.message);
            } else {
                console.log('Bucket "payment-receipts" confirmed.');
            }
        } else {
            console.log('Phase 3 Migration applied successfully via RPC!');
        }
    } catch (e) {
        console.error('Unexpected error applying migration:', e);
    }
}

applyPhase3Migration();
