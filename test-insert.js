const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Need service role to bypass RLS, or we can just try with anon key. But without auth, insert might fail.
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('properties').insert({
    title: 'Test', description: 'Test description goes here over 20 chars', price: 1000, address: 'Test', city: 'Test', state: 'Test', area: 'Test', zip_code: "",
    type: 'Apartment', bedrooms: 1, bathrooms: 1, square_footage: null,
    amenities: [], images: [], landlord_id: 'b4c8c8dd-c6de-4741-a74e-63d4c82c05ee', status: "available"
  })
  console.log('Insert error:', error);
}
test();
