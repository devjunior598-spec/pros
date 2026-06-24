import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const bodyText = await req.text();
        const paystackSignature = req.headers.get('x-paystack-signature');
        const flutterwaveSignature = req.headers.get('verif-hash');

        let isVerified = false;
        let event: any = {};
        let reference = '';
        let amount = 0;
        let gateway = '';
        let metadata: any = {};

        // 1. Paystack Webhook verification
        if (paystackSignature && process.env.PAYSTACK_SECRET_KEY) {
            const hash = crypto
                .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
                .update(bodyText)
                .digest('hex');

            if (hash === paystackSignature) {
                isVerified = true;
                event = JSON.parse(bodyText);
                if (event.event === 'charge.success') {
                    reference = event.data.reference;
                    amount = event.data.amount / 100; // kobo to Naira
                    gateway = 'Paystack';
                    metadata = event.data.metadata || {};
                }
            }
        } 
        
        // 2. Flutterwave Webhook verification
        else if (flutterwaveSignature && process.env.FLUTTERWAVE_SECRET_HASH) {
            if (flutterwaveSignature === process.env.FLUTTERWAVE_SECRET_HASH) {
                isVerified = true;
                event = JSON.parse(bodyText);
                if (event.event === 'charge.completed' && event.data.status === 'successful') {
                    reference = event.data.tx_ref;
                    amount = event.data.amount;
                    gateway = 'Flutterwave';
                    metadata = event.data.meta || {};
                }
            }
        }

        if (!isVerified || !reference) {
            return NextResponse.json({ message: 'Validation failed or ignored event' }, { status: 200 });
        }

        // Process only if it is a rent payment (matches prefix)
        if (!reference.startsWith('rent-')) {
            return NextResponse.json({ message: 'Ignored non-rent reference' }, { status: 200 });
        }

        // 3. Prevent duplicate processing
        const { data: existingPayment } = await supabaseAdmin
            .from('rent_payments')
            .select('id, payment_status, receipt_number')
            .eq('transaction_reference', reference)
            .maybeSingle();

        if (existingPayment && existingPayment.payment_status === 'Paid') {
            return NextResponse.json({ success: true, message: 'Already processed' }, { status: 200 });
        }

        const tenantId = metadata.tenant_id;
        const landlordId = metadata.landlord_id;
        const propertyId = metadata.property_id;
        const billId = metadata.bill_id;
        const dueDate = metadata.due_date;

        if (!landlordId || !propertyId) {
            console.error('Webhook missing metadata details:', reference);
            return NextResponse.json({ error: 'Metadata details missing' }, { status: 400 });
        }

        const receiptNumber = `RCP-${new Date().toISOString().substring(0,10).replace(/-/g, '')}-${reference.substring(reference.length - 4)}`.toUpperCase();

        if (existingPayment) {
            // Update existing pending payment
            await supabaseAdmin
                .from('rent_payments')
                .update({
                    payment_status: 'Paid',
                    payment_date: new Date().toISOString(),
                    receipt_number: receiptNumber,
                    amount: amount,
                    payment_method: gateway
                })
                .eq('id', existingPayment.id);
        } else {
            // Insert new payment
            await supabaseAdmin
                .from('rent_payments')
                .insert({
                    tenant_id: tenantId || null,
                    landlord_id: landlordId,
                    property_id: propertyId,
                    amount: amount,
                    payment_method: gateway,
                    transaction_reference: reference,
                    payment_status: 'Paid',
                    due_date: dueDate || null,
                    payment_date: new Date().toISOString(),
                    receipt_number: receiptNumber
                });
        }

        // Update bills table if linked
        if (billId) {
            const { data: bill } = await supabaseAdmin
                .from('bills')
                .select('amount, amount_paid')
                .eq('id', billId)
                .maybeSingle();

            if (bill) {
                const currentPaid = Number(bill.amount_paid || 0);
                const totalPaid = currentPaid + amount;
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

        // Log transaction
        if (tenantId) {
            await supabaseAdmin.from('transactions').insert({
                tenant_id: tenantId,
                type: 'debit',
                amount: amount,
                reference: reference,
                description: `Rent payment via Webhook (${gateway})`,
                status: 'success'
            });
        }

        // Notify landlord
        const { data: propertyData } = await supabaseAdmin
            .from('properties')
            .select('title')
            .eq('id', propertyId)
            .maybeSingle();

        await supabaseAdmin.rpc('create_notification', {
            p_user_id: landlordId,
            p_type: 'rent_paid',
            p_title: 'Rent Payment Webhook Received',
            p_message: `A payment of ₦${amount.toLocaleString()} has been received via ${gateway} for "${propertyData?.title || 'Property'}".`,
            p_link: '/dashboard/payments'
        });

        // Notify tenant
        if (tenantId) {
            await supabaseAdmin.rpc('create_notification', {
                p_user_id: tenantId,
                p_type: 'rent_paid',
                p_title: 'Rent Payment Webhook Successful',
                p_message: `Your payment of ₦${amount.toLocaleString()} for "${propertyData?.title || 'Property'}" was confirmed via webhook.`,
                p_link: '/dashboard/rent-payments'
            });
        }

        return NextResponse.json({ success: true, message: 'Payment webhook processed successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Webhook endpoint processing error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
