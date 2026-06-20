const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Starting login test...");
    const { data, error } = await supabase.auth.signUp({
        email: 'test' + Math.random() + '@example.com',
        password: 'password123',
        options: {
            data: {
                first_name: 'Test',
                last_name: 'User',
                role: 'tenant'
            }
        }
    });
    console.log("Result:", { data, error });
}

test();
