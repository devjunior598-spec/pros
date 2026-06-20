import { NextResponse } from 'next/server';
import { generateMonthlyBills } from '@/lib/billing';

/**
 * API route to trigger automated billing.
 * Ideally secured by a cron secret to prevent unauthorized calls.
 */
export async function GET(req: Request) {
    try {
        // Optional: Check for auth header if using a service like Vercel Cron
        // const authHeader = req.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        // }

        const results = await generateMonthlyBills();

        return NextResponse.json({
            success: true,
            summary: results
        });
    } catch (error: any) {
        console.error('Billing Cron Error:', error);
        return NextResponse.json({
            success: false,
            message: 'Internal Server Error'
        }, { status: 500 });
    }
}
