import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const payload = await req.text();
        const signature = req.headers.get('x-paystack-signature');
        const secret = process.env.PAYSTACK_SECRET_KEY;

        if (!secret) {
            return NextResponse.json({ message: 'Paystack secret not configured' }, { status: 500 });
        }

        // 1. Verify Webhook Signature
        const hash = crypto.createHmac('sha512', secret).update(payload).digest('hex');
        if (hash !== signature) {
            return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
        }

        const event = JSON.parse(payload);
        const { event: eventType, data } = event;

        // 2. Handle Transfer Events
        if (eventType === 'transfer.success' || eventType === 'transfer.failed' || eventType === 'transfer.reversed') {
            const reference = data.reference;
            const status = eventType === 'transfer.success' ? 'success' : 'failed';

            // Find the withdrawal record
            const { data: withdrawal, error: fetchError } = await supabase
                .from('withdrawals')
                .select('*')
                .eq('reference', reference)
                .single();

            if (fetchError || !withdrawal) {
                return NextResponse.json({ message: 'Withdrawal record not found' }, { status: 200 }); // Return 200 to Paystack
            }

            // Update status in withdrawals table
            await supabase
                .from('withdrawals')
                .update({ status: status })
                .eq('reference', reference);

            // Handle Refund on Failure
            if (status === 'failed') {
                const { data: wallet } = await supabase
                    .from('landlord_wallets')
                    .select('balance')
                    .eq('landlord_id', withdrawal.landlord_id)
                    .single();

                if (wallet) {
                    await supabase
                        .from('landlord_wallets')
                        .update({ balance: wallet.balance + withdrawal.amount })
                        .eq('landlord_id', withdrawal.landlord_id);

                    // Log reversal transaction
                    await supabase
                        .from('landlord_transactions')
                        .insert({
                            landlord_id: withdrawal.landlord_id,
                            type: 'credit',
                            amount: withdrawal.amount,
                            description: `Refund for failed withdrawal (${reference})`,
                            reference: `rev-${reference}`
                        });
                }
            }
        }

        return NextResponse.json({ message: 'Webhook processed' }, { status: 200 });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
