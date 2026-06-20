import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { amount, email, reference, metadata, channels } = await req.json();

        if (!amount || !email || !reference) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const paystackUrl = 'https://api.paystack.co/transaction/initialize';
        // Convert amount to kobo (integer) if strictly following Paystack, 
        // but verify if input is already in kobo or Naira. 
        // Usually Paystack expects Kobo. Assuming input 'amount' is in Naira.
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
                channels,
                callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment-success?reference=${reference}`,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Paystack error:', data);
            return NextResponse.json({ message: 'Payment initialization failed', details: data }, { status: response.status });
        }

        return NextResponse.json({ payment_url: data.data.authorization_url });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
