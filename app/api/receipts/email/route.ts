import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { receiptNumber, email, tenantName, amountPaid, datePaid, propertyName, paymentMethod, transactionReference } = body;

        if (!email || !receiptNumber) {
            return NextResponse.json({ error: 'Missing email or receipt number' }, { status: 400 });
        }

        // Simulate mailer log in terminal
        console.log(`\n======================================================`);
        console.log(`📧 SIMULATED TRANSACTION EMAIL SENT TO: ${email}`);
        console.log(`Receipt Number: ${receiptNumber}`);
        console.log(`Tenant Name:    ${tenantName}`);
        console.log(`Property Name:  ${propertyName}`);
        console.log(`Amount Paid:    ₦${Number(amountPaid).toLocaleString()}`);
        console.log(`Date Paid:      ${datePaid}`);
        console.log(`Method:         ${paymentMethod}`);
        console.log(`Reference:      ${transactionReference}`);
        console.log(`======================================================\n`);

        return NextResponse.json({ success: true, message: `Receipt successfully emailed to ${email}` });

    } catch (error: any) {
        console.error('Email receipt error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
