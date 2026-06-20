
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

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
    console.log('Testing fetch...');
    const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
        *,
        rental:rentals!inner (
            property:properties!inner (
                title,
                landlord_id
            )
        ),
        tenant:profiles (
            name
        ),
        images:request_images (
            id,
            image_url
        ),
        assignments:repair_assignments (
            *,
            provider:service_providers (*)
        ),
        quotes:repair_quotes (
            id
        ),
        reviews:reviews (
            id
        )
    `)
        // We need a landlord_id to filter by, but for now let's just see if the select works at all or fails immediately
        .limit(1);

    if (error) {
        console.error('Error fetching:', JSON.stringify(error, null, 2));
    } else {
        console.log('Success!', data);
    }
}

testFetch();
