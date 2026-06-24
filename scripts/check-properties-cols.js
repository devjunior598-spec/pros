require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkProperties() {
    console.log("1. Fetching a property row to see columns...");
    const { data: propData, error: propError } = await supabase.from('properties').select('*').limit(1);
    if (propError) {
        console.error("Error fetching properties:", propError);
    } else {
        console.log("Properties data structure sample:", propData);
        if (propData && propData.length > 0) {
            console.log("Properties columns:", Object.keys(propData[0]));
        } else {
            console.log("Properties table is empty, trying to query column details...");
            // Let's run a raw query or try to insert a dummy row that fails or check with postgres
        }
    }

    console.log("\n2. Fetching storage buckets...");
    const { data: bucketData, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
        console.error("Error fetching buckets:", bucketError);
    } else {
        console.log("Storage buckets:", bucketData);
    }
}

checkProperties();
