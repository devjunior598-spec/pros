import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-paystack-signature');

        // 1. Verify Paystack Signature
        if (!signature || !process.env.PAYSTACK_SECRET_KEY) {
            return NextResponse.json({ message: 'Missing signature or secret key' }, { status: 400 });
        }

        const hash = crypto
            .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
            .update(body)
            .digest('hex');

        if (hash !== signature) {
            return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
        }

        const event = JSON.parse(body);

        // 2. Handle successful charge
        if (event.event === 'charge.success') {
            const { reference, amount, customer, channel, ip_address, gateway_response, currency, metadata } = event.data;

            // Extract bill ID from reference (for single payments)
            let singleBillId = getBillIdFromReference(reference);
            // fallback to metadata in case reference pattern changed
            if (!singleBillId && metadata?.bill_id) {
                singleBillId = metadata.bill_id;
            }
            const batchBillIds = metadata?.bill_ids;
            const isFundWallet = metadata?.type === 'fund_wallet';

            if (isFundWallet) {
                const tenantId = metadata?.tenant_id;
                console.log(`Processing wallet funding for tenant: ${tenantId}, Amount: ${amount}`);

                if (!tenantId) {
                    return NextResponse.json({ message: 'Missing tenant_id for wallet funding' }, { status: 400 });
                }

                // 1. Log transaction
                const { error: txError } = await supabaseAdmin.from('transactions').insert({
                    tenant_id: tenantId,
                    type: 'credit',
                    amount: amount / 100,
                    reference,
                    status: 'success',
                    description: 'Wallet Funding',
                    created_at: new Date().toISOString()
                });

                if (txError) {
                    console.error('Error logging wallet transaction:', txError);
                }

                // 2. Update Wallet Balance
                // We use a simplified approach: fetch current, add amount, update. 
                // ideally use a stored procedure for atomicity.
                const { data: wallet, error: walletFetchError } = await supabaseAdmin
                    .from('wallets')
                    .select('balance')
                    .eq('tenant_id', tenantId)
                    .single();

                if (walletFetchError && walletFetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                    console.error('Error fetching wallet:', walletFetchError);
                }

                const currentBalance = wallet ? Number(wallet.balance) : 0;
                const newBalance = currentBalance + (amount / 100);

                const { error: walletUpdateError } = await supabaseAdmin
                    .from('wallets')
                    .upsert({
                        tenant_id: tenantId,
                        balance: newBalance,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'tenant_id' });

                if (walletUpdateError) {
                    console.error('Error updating wallet balance:', walletUpdateError);
                    return NextResponse.json({ message: 'Error updating wallet' }, { status: 500 });
                }

            } else if (batchBillIds && Array.isArray(batchBillIds)) {
                // Handling batch payment
                console.log(`Processing batch payment for bills: ${batchBillIds.join(', ')}`);

                // 3. Log the payment record (bill_id is null for batch)
                const { error: paymentError } = await supabaseAdmin.from('payments').insert({
                    bill_id: null,
                    amount: amount / 100,
                    status: 'success',
                    reference,
                    payment_method: channel,
                    channel,
                    currency,
                    ip_address,
                    metadata: {
                        customer,
                        gateway_response,
                        ...metadata
                    }
                });

                if (paymentError) {
                    console.error('Error recording batch payment to DB:', paymentError);
                }

                // 4. Update all Bills status
                const { error: billsError } = await supabaseAdmin
                    .from('bills')
                    .update({
                        status: 'paid',
                        paid_at: new Date().toISOString()
                    })
                    .in('id', batchBillIds);

                if (billsError) {
                    console.error('Error updating batch bills status:', billsError);
                    return NextResponse.json({ message: 'Error updating bills' }, { status: 500 });
                }

            } else if (singleBillId) {
                // Handling single payment
                const amountInNaira = amount / 100; // Convert Kobo to Naira

                // 3. Log the payment record
                const { error: paymentError } = await supabaseAdmin.from('payments').insert({
                    bill_id: singleBillId,
                    amount: amountInNaira,
                    status: 'success',
                    reference,
                    payment_method: channel,
                    channel,
                    currency,
                    ip_address,
                    metadata: {
                        customer,
                        gateway_response,
                        ...metadata
                    }
                });

                if (paymentError) {
                    console.error('Error recording payment to DB:', paymentError);
                }

                // 4. Fetch existing bill to compute new paid amount
                const { data: existingBill, error: fetchError } = await supabaseAdmin
                    .from('bills')
                    .select('amount, amount_paid')
                    .eq('id', singleBillId)
                    .single();

                if (fetchError) {
                    console.error('Error fetching bill for update:', fetchError);
                }

                const previousPaid = existingBill?.amount_paid || 0;
                const billTotal = existingBill?.amount || 0;
                const updatedPaid = previousPaid + amountInNaira;
                const newStatus = updatedPaid >= billTotal ? 'paid' : 'partially_paid';

                const updatePayload: any = {
                    amount_paid: updatedPaid,
                    status: newStatus
                };
                if (newStatus === 'paid') {
                    updatePayload.paid_at = new Date().toISOString();
                }

                const { error: billError } = await supabaseAdmin
                    .from('bills')
                    .update(updatePayload)
                    .eq('id', singleBillId);

                if (billError) {
                    console.error('Error updating bill status:', billError);
                    return NextResponse.json({ message: 'Error updating bill' }, { status: 500 });
                }

                console.log(`Successfully processed unique payment for bill: ${singleBillId}`);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

function getBillIdFromReference(reference: string) {
    // Format: bill-{id}-{timestamp}
    if (!reference.startsWith('bill-')) return null;
    const parts = reference.split('-');
    if (parts.length >= 2) {
        return parts[1];
    }
    return null;
}
