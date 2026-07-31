import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getCurrentUserWithRole } from '@/lib/supabase-server';

export async function POST(req: Request) {
    try {
        const currentUser = await getCurrentUserWithRole();
        if (!currentUser) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        if (currentUser.role !== 'tenant') {
            return NextResponse.json({ error: 'Only tenants can initiate rent payments' }, { status: 403 });
        }

        const { amount, reference, paymentMethod, metadata } = await req.json();
        const paymentAmount = Number(amount);
        const billId = metadata?.bill_id;

        if (!Number.isFinite(paymentAmount) || paymentAmount <= 0 || !reference || !paymentMethod || !billId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data: bill } = await supabaseAdmin
            .from('bills')
            .select('id, amount, amount_paid, rental:rentals!inner(tenant_id, landlord_id, property_id)')
            .eq('id', billId)
            .maybeSingle();

        if (!bill || bill.rental?.tenant_id !== currentUser.user.id) {
            return NextResponse.json({ error: 'You can only pay bills assigned to your account' }, { status: 403 });
        }

        const outstandingAmount = Number(bill.amount) - Number(bill.amount_paid || 0);
        if (paymentAmount > outstandingAmount) {
            return NextResponse.json({ error: 'Payment amount exceeds the outstanding bill balance' }, { status: 400 });
        }

        if (!reference.startsWith(`rent-${billId}-`)) {
            return NextResponse.json({ error: 'Invalid payment reference' }, { status: 400 });
        }

        const paymentMetadata = {
            bill_id: bill.id,
            tenant_id: currentUser.user.id,
            landlord_id: bill.rental.landlord_id,
            property_id: bill.rental.property_id,
            due_date: metadata?.due_date || null,
        };
        const email = currentUser.user.email;
        if (!email) {
            return NextResponse.json({ error: 'Add an email address to your account before paying online' }, { status: 400 });
        }

        const gateway = paymentMethod.toLowerCase();

        if (gateway === 'paystack') {
            const paystackUrl = 'https://api.paystack.co/transaction/initialize';
            const amountInKobo = Math.round(paymentAmount * 100);

            const response = await fetch(paystackUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    amount: amountInKobo,
                    reference,
                    metadata: paymentMetadata,
                    callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/payment-success?reference=${reference}&gateway=paystack`,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Paystack init error:', data);
                return NextResponse.json({ error: 'Paystack initialization failed', details: data }, { status: response.status });
            }

            return NextResponse.json({ payment_url: data.data.authorization_url });
        } 
        
        else if (gateway === 'flutterwave') {
            const flutterwaveUrl = 'https://api.flutterwave.com/v3/payments';

            const response = await fetch(flutterwaveUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tx_ref: reference,
                    amount: paymentAmount,
                    currency: 'NGN',
                    redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/payment-success?reference=${reference}&gateway=flutterwave`,
                    customer: {
                        email: email,
                    },
                    customizations: {
                        title: 'PRMS Rent Payment',
                        description: 'Payment for rental lease',
                        logo: 'https://housedoplatform.com/logo.png'
                    },
                    meta: paymentMetadata
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Flutterwave init error:', data);
                return NextResponse.json({ error: 'Flutterwave initialization failed', details: data }, { status: response.status });
            }

            return NextResponse.json({ payment_url: data.data.link });
        }

        return NextResponse.json({ error: 'Unsupported payment gateway' }, { status: 400 });

    } catch (error: any) {
        console.error('Initiate payment error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
