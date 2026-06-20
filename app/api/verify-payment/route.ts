import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const { reference } = await req.json();

        if (!reference) {
            return NextResponse.json({ message: 'Missing reference' }, { status: 400 });
        }

        // 1. Verify with Paystack
        const paystackUrl = `https://api.paystack.co/transaction/verify/${reference}`;
        const paystackRes = await fetch(paystackUrl, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
        });

        const data = await paystackRes.json();

        if (!paystackRes.ok || !data.status) {
            return NextResponse.json({ message: 'Payment verification failed', details: data }, { status: 400 });
        }

        // 2. Extract Data
        const { status, amount, metadata, customer, channel } = data.data;

        if (status !== 'success') {
            return NextResponse.json({ message: `Payment status is ${status}` }, { status: 400 });
        }

        const tenantId = metadata?.tenant_id;
        if (!tenantId) {
            console.error('No tenant_id in metadata for reference:', reference);
            return NextResponse.json({ message: 'Invalid payment metadata' }, { status: 400 });
        }

        // 3. Check if we already processed this reference (Race condition with webhook)
        const { data: existingTx } = await supabaseAdmin
            .from('transactions')
            .select('id')
            .eq('reference', reference)
            .single();

        if (existingTx) {
            // Already processed by Webhook or previous call
            return NextResponse.json({ success: true, message: 'Payment already processed' });
        }

        // 4. Find the wallet
        const { data: wallet, error: walletError } = await supabaseAdmin
            .from('wallets')
            .select('id, balance')
            .eq('tenant_id', tenantId)
            .single();

        if (walletError || !wallet) {
            console.error('Wallet not found for tenant:', tenantId);
            return NextResponse.json({ message: 'Wallet not found' }, { status: 404 });
        }

        // 5. Update Balance atomically and insert transaction
        // Convert from Kobo to Naira
        const amountInNaira = amount / 100;
        const newBalance = Number(wallet.balance) + amountInNaira;

        // Log transaction
        const { error: txError } = await supabaseAdmin.from('transactions').insert({
            tenant_id: tenantId,
            type: 'credit',
            amount: amountInNaira,
            reference: reference,
            description: `Wallet funding via ${channel || 'card'}`,
            status: 'success'
        });

        if (txError) throw txError;

        // Update Wallet
        const { error: updateError } = await supabaseAdmin
            .from('wallets')
            .update({
                balance: newBalance,
                paystack_customer_id: customer?.customer_code || null // Optionally save customer code
            })
            .eq('id', wallet.id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, newBalance });

    } catch (error: any) {
        console.error('Verification error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
