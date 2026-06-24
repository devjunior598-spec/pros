require('dotenv').config({ path: '.env.local' });
const https = require('https');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const url = `${supabaseUrl}/rest/v1/`;

const options = {
    headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
    }
};

https.get(url, options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const spec = JSON.parse(data);
            console.log("Tables found in schema:");
            if (spec.paths) {
                const paths = Object.keys(spec.paths);
                const tables = paths.filter(p => p !== '/' && !p.startsWith('/rpc/'));
                const rpcs = paths.filter(p => p.startsWith('/rpc/'));
                console.log("Tables:", tables);
                console.log("RPCs:", rpcs);
            } else {
                console.log("No paths found. Response:", data);
            }
        } catch (e) {
            console.error("Failed to parse JSON:", e.message);
            console.log("Response:", data);
        }
    });
}).on('error', (err) => {
    console.error("Error:", err.message);
});
