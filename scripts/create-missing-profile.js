require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createProfile() {
    const userId = process.argv[2] || '86331d58-9fcc-44bb-96fb-6a309c63533f';
    const role = process.argv[3] || 'tenant';
    const name = process.argv[4] || 'New User';
    console.log(`Creating profile for: ${userId} with role ${role} and name ${name}`);

    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    let email = 'unknown@example.com';
    let profileName = name;

    if (!authError && authUser?.user) {
        email = authUser.user.email;
        if (authUser.user.user_metadata?.first_name) {
            profileName = `${authUser.user.user_metadata.first_name} ${authUser.user.user_metadata.last_name || ''}`.trim();
        }
    }

    // Attempt to insert profile
    const { data, error } = await supabase
        .from('profiles')
        .insert({
            id: userId,
            name: profileName,
            email: email,
            role: role
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating profile:', error);
    } else {
        console.log('Profile created successfully:', data);
    }
}

createProfile();
