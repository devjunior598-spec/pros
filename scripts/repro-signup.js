const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
    try {
        const email = `test.user.${Date.now()}@example.com`;
        const password = 'Password123!';

        console.log(`Attempting to sign up with email: ${email}`);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: 'Test',
                    last_name: 'User',
                    role: 'tenant',
                },
            },
        });

        if (error) {
            console.error('Signup FAILED:');
            console.error(JSON.stringify(error, null, 2));
        } else {
            console.log('Signup SUCCESS:');
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error("UNHANDLED ERROR:");
        console.error(err);
    }
}

testSignup();
