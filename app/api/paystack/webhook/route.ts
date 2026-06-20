import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-paystack-signature');

        // 1. Verify Paystack Signature
        if (!signature || !process.env.PAYSTACK_SECRET_KEY) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const hash = crypto
            .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
            .update(body)
            .digest('hex');

        if (hash !== signature) {
            return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
        }

        const event = JSON.parse(body);

        // 2. Handle successful charge (This includes Dedicated Virtual Account transfers)
        if (event.event === 'charge.success') {
            const { amount, customer, reference, channel, metadata } = event.data;
            let tenantId = metadata?.tenant_id;

            // 3. Find the wallet associated with this tenant
            if (!tenantId) {
                // Fallback if no metadata (like an auto-charge on an existing authorized card)
                const { data: existingWallet } = await supabaseAdmin
                    .from('wallets')
                    .select('tenant_id')
                    .eq('paystack_customer_id', customer.customer_code)
                    .single();

                tenantId = existingWallet?.tenant_id;
            }

            if (!tenantId) {
                console.error('Could not identify tenant from metadata or customer_code:', customer.customer_code);
                return NextResponse.json({ message: 'Tenant unidentifiable' }, { status: 404 });
            }

            const { data: wallet, error: walletError } = await supabaseAdmin
                .from('wallets')
                .select('id, balance')
                .eq('tenant_id', tenantId)
                .single();

            if (walletError || !wallet) {
                console.error('Wallet not found for tenant:', tenantId);
                return NextResponse.json({ message: 'Wallet not found' }, { status: 404 });
            }

            // 4. Check for duplicate transaction
            const { data: existingTx } = await supabaseAdmin
                .from('transactions')
                .select('id')
                .eq('reference', reference)
                .single();

            if (existingTx) {
                return NextResponse.json({ message: 'Duplicate transaction' }, { status: 200 });
            }

            // 5. Atomic Update: Credit Wallet & Log Transaction
            const amountInNaira = amount / 100;

            // Log transaction first
            const { error: txError } = await supabaseAdmin.from('transactions').insert({
                tenant_id: tenantId,
                type: 'credit',
                amount: amountInNaira,
                reference: reference,
                description: `Wallet funding via ${channel}`,
                status: 'success'
            });

            if (txError) {
                console.error('Failed to log transaction:', txError);
                return NextResponse.json({ message: 'Transaction logging failed' }, { status: 500 });
            }

            // Update balance and capture customer code if needed
            const newBalance = Number(wallet.balance) + amountInNaira;
            const { error: updateError } = await supabaseAdmin
                .from('wallets')
                .update({
                    balance: newBalance,
                    paystack_customer_id: customer.customer_code
                })
                .eq('id', wallet.id);

            if (updateError) {
                console.error('Failed to update wallet balance:', updateError);
                return NextResponse.json({ message: 'Balance update failed' }, { status: 500 });
            }

            console.log(`Successfully funded wallet for tenant ${tenantId}: +₦${amountInNaira}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
