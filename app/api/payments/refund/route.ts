import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { paymentId } = body;

        if (!paymentId) {
            return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });
        }

        // 1. Fetch the payment record
        const { data: payment, error: fetchError } = await supabaseAdmin
            .from('rent_payments')
            .select('*, property:properties(title)')
            .eq('id', paymentId)
            .maybeSingle();

        if (fetchError || !payment) {
            return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
        }

        if (payment.payment_status === 'Refunded') {
            return NextResponse.json({ error: 'This payment has already been refunded.' }, { status: 400 });
        }

        if (payment.payment_status !== 'Paid') {
            return NextResponse.json({ error: 'Only paid transactions can be refunded.' }, { status: 400 });
        }

        // 2. Mark payment as Refunded
        const { error: updateError } = await supabaseAdmin
            .from('rent_payments')
            .update({
                payment_status: 'Refunded'
            })
            .eq('id', paymentId);

        if (updateError) throw updateError;

        // 3. Update the bills table if linked
        if (payment.bill_id) {
            const { data: bill } = await supabaseAdmin
                .from('bills')
                .select('amount, amount_paid, due_date')
                .eq('id', payment.bill_id)
                .maybeSingle();

            if (bill) {
                const currentPaid = Number(bill.amount_paid || 0);
                const totalPaid = Math.max(0, currentPaid - Number(payment.amount));
                const dueDateTime = new Date(bill.due_date).getTime();
                const newStatus = totalPaid >= Number(bill.amount) 
                    ? 'paid' 
                    : totalPaid > 0 
                        ? 'partially_paid' 
                        : dueDateTime < Date.now() ? 'overdue' : 'pending';

                await supabaseAdmin
                    .from('bills')
                    .update({
                        amount_paid: totalPaid,
                        status: newStatus,
                        paid_at: null
                    })
                    .eq('id', payment.bill_id);
            }
        }

        // 4. Refund to tenant wallet if tenant exists
        if (payment.tenant_id) {
            // Find wallet
            const { data: wallet } = await supabaseAdmin
                .from('wallets')
                .select('id, balance')
                .eq('tenant_id', payment.tenant_id)
                .maybeSingle();

            if (wallet) {
                const newBalance = Number(wallet.balance) + Number(payment.amount);
                
                // Log credit transaction
                await supabaseAdmin.from('transactions').insert({
                    tenant_id: payment.tenant_id,
                    type: 'credit',
                    amount: payment.amount,
                    reference: `REFUND-${payment.transaction_reference}`,
                    description: `Refund for rent payment (${payment.transaction_reference})`,
                    status: 'success'
                });

                // Update Wallet balance
                await supabaseAdmin
                    .from('wallets')
                    .update({ balance: newBalance })
                    .eq('id', wallet.id);
            }

            // Notify Tenant
            await supabaseAdmin.rpc('create_notification', {
                p_user_id: payment.tenant_id,
                p_type: 'rent_refunded',
                p_title: 'Rent Refunded',
                p_message: `A refund of ₦${Number(payment.amount).toLocaleString()} for "${payment.property?.title || 'Property'}" has been credited to your wallet.`,
                p_link: '/dashboard/rent-payments'
            });
        }

        // Notify Landlord
        await supabaseAdmin.rpc('create_notification', {
            p_user_id: payment.landlord_id,
            p_type: 'rent_refunded',
            p_title: 'Rent Refunded by Admin',
            p_message: `Admin issued a refund of ₦${Number(payment.amount).toLocaleString()} to tenant for "${payment.property?.title || 'Property'}".`,
            p_link: '/dashboard/payments'
        });

        return NextResponse.json({ success: true, message: 'Payment successfully refunded' });

    } catch (error: any) {
        console.error('Refund transaction error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
