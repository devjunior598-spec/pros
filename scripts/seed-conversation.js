require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedConversation() {
    // 1. Get a Landlord
    const { data: landlords, error: lError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'landlord')
        .limit(1);

    if (lError || !landlords || landlords.length === 0) {
        console.error('No landlords found:', lError);
        return;
    }

    // 2. Get a Tenant
    const { data: tenants, error: tError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'tenant')
        .limit(1);

    if (tError || !tenants || tenants.length === 0) {
        console.error('No tenants found:', tError);
        return;
    }

    const landlord = landlords[0];
    const tenant = tenants[0];

    // 2.5 Get a Rental
    const { data: rentals, error: rError } = await supabase
        .from('rentals')
        .select('id')
        .limit(1);

    if (rError || !rentals || rentals.length === 0) {
        console.error('No rentals found:', rError);
        return;
    }
    const rental = rentals[0];

    // 3. Create Conversation
    const { data: newConv, error: cError } = await supabase
        .from('conversations')
        .insert({
            landlord_id: landlord.id,
            tenant_id: tenant.id,
            rental_id: rental.id,
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (cError) {
        console.error('Error creating conversation:', cError);
    } else {
        console.log('Created conversation:', newConv.id);

        // 4. Seed a message
        await supabase.from('messages').insert({
            conversation_id: newConv.id,
            sender_id: tenant.id,
            message: "Hello! This is a test message to start the conversation.",
            type: 'text'
        });
        console.log('Seeded initial message.');
    }
}

seedConversation();
