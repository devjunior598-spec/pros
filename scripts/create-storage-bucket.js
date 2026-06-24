require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createStorageBucket() {
    console.log("Checking storage buckets for 'property-images'...");
    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error("Error listing buckets:", error);
            return;
        }

        const bucketExists = buckets.some(b => b.name === 'property-images');
        if (bucketExists) {
            console.log("Bucket 'property-images' already exists.");
        } else {
            console.log("Creating 'property-images' bucket...");
            const { data, error: createError } = await supabase.storage.createBucket('property-images', {
                public: true,
                allowedMimeTypes: ['image/*']
            });

            if (createError) {
                console.error("Error creating bucket:", createError);
            } else {
                console.log("Bucket 'property-images' created successfully:", data);
            }
        }
    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

createStorageBucket();
