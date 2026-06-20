const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');
// const fetch = require('node-fetch'); // Use global fetch in Node 18+

// Load env specific to local dev
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

async function testWebhook() {
    console.log('--- Testing Wallet Webhook ---');

    // 1. Get a tenant
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'tenant')
        .limit(1);

    if (profileError || !profiles || profiles.length === 0) {
        console.log('No tenant found or error:', profileError);
        return;
    }

    const tenant = profiles[0];
    console.log(`Using tenant: ${tenant.email} (${tenant.id})`);

    // 2. Ensure wallet exists
    const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('tenant_id', tenant.id)
        .maybeSingle();

    let currentBalance = 0;
    if (!wallet) {
        console.log('Wallet missing, creating one...');
        const { error: createError } = await supabase
            .from('wallets')
            .insert({ tenant_id: tenant.id, balance: 0 });

        if (createError) {
            console.error('Failed to create wallet:', createError);
            // If error is relation issue, then table might be missing
            return;
        }
    } else {
        currentBalance = wallet.balance;
        console.log(`Current Wallet Balance: ${currentBalance}`);
    }

    // 3. Simulate Webhook
    const amount = 500000; // 5000.00 NGN (in kobo) -> 5000
    // Wait, my webhook implementation divides by 100.
    // If I send 500000 (5000 * 100), the webhook code: count = amount / 100 = 5000.
    // Correct.

    const reference = `test-fund-${Date.now()}`;
    const payload = JSON.stringify({
        event: 'charge.success',
        data: {
            reference,
            amount: amount,
            status: 'success',
            customer: { email: tenant.email },
            channel: 'card',
            currency: 'NGN',
            metadata: {
                type: 'fund_wallet',
                tenant_id: tenant.id
            }
        }
    });

    // Sign request
    const secret = process.env.PAYSTACK_SECRET_KEY || ''; // We need this in .env.local for this script to work if we want to mimic signature
    // Only if the webhook verifies signature. My code does:
    // const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)...

    if (!secret) {
        console.error('Missing PAYSTACK_SECRET_KEY in env, cannot sign request');
        return;
    }

    const signature = crypto
        .createHmac('sha512', secret)
        .update(payload)
        .digest('hex');

    console.log('Sending webhook request...');
    console.log('URL:', 'http://localhost:3000/api/webhook');

    try {
        const res = await fetch('http://localhost:3000/api/webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-paystack-signature': signature
            },
            body: payload
        });

        if (res.ok) {
            console.log('Webhook sent successfully.');
        } else {
            console.log('Webhook failed:', res.status, await res.text());
        }

        // 4. Verify Balance Update
        // Wait a bit for async processing if any (though webhook in nextjs is usually sync unless using background workers)
        console.log('Checking new balance...');

        const { data: newWallet } = await supabase
            .from('wallets')
            .select('balance')
            .eq('tenant_id', tenant.id)
            .single();

        console.log(`New Balance: ${newWallet?.balance}`);
        const expected = Number(currentBalance) + (amount / 100);

        if (Number(newWallet?.balance) === expected) {
            console.log('SUCCESS: Wallet funded correctly!');
        } else {
            console.log(`FAILURE: Expected ${expected}, got ${newWallet?.balance}`);
        }

    } catch (e) {
        console.error('Error sending webhook:', e);
    }
}

testWebhook();
