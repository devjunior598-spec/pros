import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { paystack } from '@/lib/paystack';

export async function POST(req: Request) {
    try {
        const { userId, email, firstName, lastName } = await req.json();

        if (!userId || !email) {
            return NextResponse.json({ message: 'Missing user data' }, { status: 400 });
        }

        // 1. Check if wallet already exists
        const { data: existingWallet } = await supabaseAdmin
            .from('wallets')
            .select('id')
            .eq('tenant_id', userId)
            .single();

        if (existingWallet) {
            return NextResponse.json({ message: 'Wallet already exists' }, { status: 200 });
        }

        // 2. Create Paystack Customer
        const customer = await paystack.createCustomer(email, firstName, lastName);

        // 3. Create Dedicated Virtual Account
        let virtualAccount;
        try {
            virtualAccount = await paystack.createDedicatedAccount(customer.customer_code);
        } catch (error: any) {
            console.error("Virtual account creation failed:", error);
            // We still create the wallet record even if DVA fails, 
            // the user can try to generate it later or we can retry.
        }

        // 4. Create Wallet Record in DB
        const { error: walletError } = await supabaseAdmin
            .from('wallets')
            .insert({
                tenant_id: userId,
                balance: 0,
                paystack_customer_id: customer.customer_code,
                virtual_account_number: virtualAccount?.account_number || null,
                bank_name: virtualAccount?.bank?.name || null,
                account_name: virtualAccount?.account_name || null,
            });

        if (walletError) {
            console.error("DB Error creating wallet:", walletError);
            return NextResponse.json({ message: 'Failed to save wallet record' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Wallet initialization error:', error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
