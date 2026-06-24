import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const { reference, gateway } = await req.json();

        if (!reference || !gateway) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const gatewayLower = gateway.toLowerCase();
        let status = 'failed';
        let verifiedAmount = 0;
        let metadata: any = {};
        let txData: any = {};

        // 1. Verify with Paystack
        if (gatewayLower === 'paystack') {
            const paystackUrl = `https://api.paystack.co/transaction/verify/${reference}`;
            const paystackRes = await fetch(paystackUrl, {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                },
            });

            const data = await paystackRes.json();

            if (!paystackRes.ok || !data.status) {
                return NextResponse.json({ error: 'Paystack verification failed', details: data }, { status: 400 });
            }

            txData = data.data;
            status = txData.status; // 'success', 'failed', 'abandoned'
            verifiedAmount = txData.amount / 100; // convert Kobo to Naira
            metadata = txData.metadata || {};
        } 
        
        // 2. Verify with Flutterwave
        else if (gatewayLower === 'flutterwave') {
            const flutterwaveUrl = `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`;
            const flutterwaveRes = await fetch(flutterwaveUrl, {
                headers: {
                    Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
                },
            });

            const data = await flutterwaveRes.json();

            if (!flutterwaveRes.ok || data.status !== 'success') {
                return NextResponse.json({ error: 'Flutterwave verification failed', details: data }, { status: 400 });
            }

            txData = data.data;
            status = txData.status; // 'successful', 'failed'
            verifiedAmount = txData.amount; // already in Naira
            metadata = txData.meta || {};
        } 
        
        else {
            return NextResponse.json({ error: 'Unsupported payment gateway' }, { status: 400 });
        }

        const isSuccess = status === 'success' || status === 'successful';

        if (!isSuccess) {
            return NextResponse.json({ error: `Payment transaction is ${status}` }, { status: 400 });
        }

        // 3. Prevent duplicate processing
        const { data: existingPayment } = await supabaseAdmin
            .from('rent_payments')
            .select('id, payment_status, receipt_number')
            .eq('transaction_reference', reference)
            .maybeSingle();

        if (existingPayment && existingPayment.payment_status === 'Paid') {
            return NextResponse.json({ success: true, message: 'Payment already processed', receiptNumber: existingPayment.receipt_number });
        }

        // Extract metadata variables
        const tenantId = metadata.tenant_id;
        const landlordId = metadata.landlord_id;
        const propertyId = metadata.property_id;
        const billId = metadata.bill_id;
        const dueDate = metadata.due_date;

        if (!landlordId || !propertyId) {
            return NextResponse.json({ error: 'Invalid payment metadata' }, { status: 400 });
        }

        const receiptNumber = `RCP-${new Date().toISOString().substring(0,10).replace(/-/g, '')}-${reference.substring(reference.length - 4)}`.toUpperCase();

        let paymentId = existingPayment?.id;

        if (existingPayment) {
            // Update existing pending payment record
            const { error: updateError } = await supabaseAdmin
                .from('rent_payments')
                .update({
                    payment_status: 'Paid',
                    payment_date: new Date().toISOString(),
                    receipt_number: receiptNumber,
                    amount: verifiedAmount,
                    payment_method: gatewayLower === 'paystack' ? 'Paystack' : 'Flutterwave'
                })
                .eq('id', existingPayment.id);

            if (updateError) throw updateError;
        } else {
            // Insert new payment record
            const { data: insertedData, error: insertError } = await supabaseAdmin
                .from('rent_payments')
                .insert({
                    tenant_id: tenantId || null,
                    landlord_id: landlordId,
                    property_id: propertyId,
                    amount: verifiedAmount,
                    payment_method: gatewayLower === 'paystack' ? 'Paystack' : 'Flutterwave',
                    transaction_reference: reference,
                    payment_status: 'Paid',
                    due_date: dueDate || null,
                    payment_date: new Date().toISOString(),
                    receipt_number: receiptNumber
                })
                .select('id')
                .single();

            if (insertError) throw insertError;
            paymentId = insertedData.id;
        }

        // 4. Update the bills table if linked
        if (billId) {
            const { data: bill } = await supabaseAdmin
                .from('bills')
                .select('amount, amount_paid')
                .eq('id', billId)
                .maybeSingle();

            if (bill) {
                const currentPaid = Number(bill.amount_paid || 0);
                const totalPaid = currentPaid + verifiedAmount;
                const newStatus = totalPaid >= Number(bill.amount) ? 'paid' : 'partially_paid';

                await supabaseAdmin
                    .from('bills')
                    .update({
                        amount_paid: totalPaid,
                        status: newStatus,
                        paid_at: newStatus === 'paid' ? new Date().toISOString() : null
                    })
                    .eq('id', billId);
            }
        }

        // 5. Log in standard transactions table for wallet/history compatibility
        if (tenantId) {
            await supabaseAdmin.from('transactions').insert({
                tenant_id: tenantId,
                type: 'debit',
                amount: verifiedAmount,
                reference: reference,
                description: `Rent payment via ${gateway}`,
                status: 'success'
            });
        }

        // 6. Generate a notification for the landlord
        const { data: propertyData } = await supabaseAdmin
            .from('properties')
            .select('title')
            .eq('id', propertyId)
            .maybeSingle();

        await supabaseAdmin.rpc('create_notification', {
            p_user_id: landlordId,
            p_type: 'rent_paid',
            p_title: 'Rent Payment Received',
            p_message: `A payment of ₦${verifiedAmount.toLocaleString()} has been received for "${propertyData?.title || 'Property'}".`,
            p_link: '/dashboard/payments'
        });

        // 7. Generate notification for the tenant
        if (tenantId) {
            await supabaseAdmin.rpc('create_notification', {
                p_user_id: tenantId,
                p_type: 'rent_paid',
                p_title: 'Rent Payment Successful',
                p_message: `Your payment of ₦${verifiedAmount.toLocaleString()} for "${propertyData?.title || 'Property'}" was processed successfully.`,
                p_link: '/dashboard/rent-payments'
            });
        }

        return NextResponse.json({ success: true, receiptNumber, amount: verifiedAmount });

    } catch (error: any) {
        console.error('Payment verification api error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
