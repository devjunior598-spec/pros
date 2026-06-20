import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { supabaseAdmin } from '@/lib/supabase-admin';

async function setupStorage() {
    console.log('Checking storage buckets...');

    try {
        const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();

        if (error) {
            console.error('Error listing buckets:', error);
            return;
        }

        const chatBucket = buckets.find(b => b.name === 'chat-files');

        if (chatBucket) {
            console.log('Bucket "chat-files" already exists.');
        } else {
            console.log('Creating "chat-files" bucket...');
            const { data, error: createError } = await supabaseAdmin.storage.createBucket('chat-files', {
                public: true,
                fileSizeLimit: 10485760, // 10MB
                allowedMimeTypes: ['image/*', 'application/pdf']
            });

            if (createError) {
                console.error('Error creating bucket:', createError);
            } else {
                console.log('Bucket "chat-files" created successfully.');
            }
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

setupStorage();
