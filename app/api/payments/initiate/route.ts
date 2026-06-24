import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { amount, email, reference, paymentMethod, metadata } = await req.json();

        if (!amount || !email || !reference || !paymentMethod) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const gateway = paymentMethod.toLowerCase();

        if (gateway === 'paystack') {
            const paystackUrl = 'https://api.paystack.co/transaction/initialize';
            const amountInKobo = Math.round(amount * 100);

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
                    metadata,
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
                    amount: amount,
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
                    meta: metadata
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
