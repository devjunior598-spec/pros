import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { paystack } from '@/lib/paystack';

export async function POST(req: Request) {
    try {
        const { userId, amount } = await req.json();

        if (!userId || !amount) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const MIN_WITHDRAWAL = 5000;
        if (amount < MIN_WITHDRAWAL) {
            return NextResponse.json({ success: false, message: `Minimum withdrawal amount is ₦${MIN_WITHDRAWAL.toLocaleString()}` }, { status: 400 });
        }

        // 1. Fetch landlord wallet and verify bank details
        const { data: wallet, error: walletError } = await supabase
            .from('landlord_wallets')
            .select('balance, recipient_code, bank_account_number, bank_name, total_withdrawn')
            .eq('landlord_id', userId)
            .single();

        if (walletError || !wallet) {
            return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });
        }

        if (!wallet.recipient_code) {
            return NextResponse.json({ success: false, message: 'Please link and verify your bank account first' }, { status: 400 });
        }

        if (wallet.balance < amount) {
            return NextResponse.json({ success: false, message: 'Insufficient balance' }, { status: 400 });
        }

        // 2. Prepare Reference
        const reference = `wd-${userId.substring(0, 8)}-${Date.now()}`;

        // 3. Log Pending Withdrawal in DB
        const { error: withdrawError } = await supabase
            .from('withdrawals')
            .insert({
                landlord_id: userId,
                amount: amount,
                status: 'pending',
                reference: reference,
                bank_details: {
                    bank_name: wallet.bank_name,
                    account_number: wallet.bank_account_number
                }
            });

        if (withdrawError) throw withdrawError;

        // 4. Initiate Paystack Transfer
        let transfer;
        try {
            transfer = await paystack.initiateTransfer(
                amount,
                wallet.recipient_code,
                reference,
                `Withdrawal to ${wallet.bank_name}`
            );
        } catch (err: any) {
            // If initiation fails, we should ideally mark as failed or just return error
            // We'll mark as failed in DB
            await supabase
                .from('withdrawals')
                .update({ status: 'failed' })
                .eq('reference', reference);

            return NextResponse.json({ success: false, message: err.message || 'Payment initiation failed' }, { status: 400 });
        }

        // 5. Deduct Balance from Wallet (Optimistic)
        // We deduct now, and if it fails later (webhook), we refund.
        const { error: deductError } = await supabase
            .from('landlord_wallets')
            .update({
                balance: wallet.balance - amount,
                total_withdrawn: (wallet.total_withdrawn || 0) + amount
            })
            .eq('landlord_id', userId);

        if (deductError) throw deductError;

        // 6. Log Transaction
        await supabase
            .from('landlord_transactions')
            .insert({
                landlord_id: userId,
                type: 'debit',
                amount: amount,
                description: `Withdrawal request to ${wallet.bank_name}`,
                reference: reference
            });

        return NextResponse.json({
            success: true,
            message: 'Withdrawal initiated successfully',
            data: { reference, status: transfer.status }
        });

    } catch (error: any) {
        console.error('Withdrawal Error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
