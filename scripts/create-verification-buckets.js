require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createVerificationBuckets() {
    const bucketsToCreate = ['landlord-documents', 'tenant-documents', 'property-documents'];
    console.log("Checking storage buckets...");

    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error("Error listing buckets:", error);
            return;
        }

        for (const bucketName of bucketsToCreate) {
            const bucketExists = buckets.some(b => b.name === bucketName);
            if (bucketExists) {
                console.log(`Bucket '${bucketName}' already exists.`);
            } else {
                console.log(`Creating '${bucketName}' bucket...`);
                const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
                    public: false // Private bucket for secure files
                });

                if (createError) {
                    console.error(`Error creating bucket '${bucketName}':`, createError);
                } else {
                    console.log(`Bucket '${bucketName}' created successfully.`);
                }
            }
        }
    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

createVerificationBuckets();
