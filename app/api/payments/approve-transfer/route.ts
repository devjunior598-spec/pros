import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { paymentId, action, rejectionReason } = body;

        if (!paymentId || !action) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // 1. Fetch the existing payment record
        const { data: payment, error: fetchError } = await supabaseAdmin
            .from('rent_payments')
            .select('*, property:properties(title)')
            .eq('id', paymentId)
            .maybeSingle();

        if (fetchError || !payment) {
            return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
        }

        if (payment.payment_status !== 'Pending') {
            return NextResponse.json({ error: 'This payment has already been processed.' }, { status: 400 });
        }

        const receiptNumber = `RCP-${new Date().toISOString().substring(0,10).replace(/-/g, '')}-${payment.transaction_reference.substring(payment.transaction_reference.length - 4)}`.toUpperCase();

        if (action === 'approve') {
            // Update payment record to Paid
            const { error: updateError } = await supabaseAdmin
                .from('rent_payments')
                .update({
                    payment_status: 'Paid',
                    payment_date: new Date().toISOString(),
                    receipt_number: receiptNumber
                })
                .eq('id', paymentId);

            if (updateError) throw updateError;

            // If linked to a bill, update the bill
            if (payment.bill_id) {
                const { data: bill } = await supabaseAdmin
                    .from('bills')
                    .select('amount, amount_paid')
                    .eq('id', payment.bill_id)
                    .maybeSingle();

                if (bill) {
                    const currentPaid = Number(bill.amount_paid || 0);
                    const totalPaid = currentPaid + Number(payment.amount);
                    const newStatus = totalPaid >= Number(bill.amount) ? 'paid' : 'partially_paid';

                    await supabaseAdmin
                        .from('bills')
                        .update({
                            amount_paid: totalPaid,
                            status: newStatus,
                            paid_at: newStatus === 'paid' ? new Date().toISOString() : null
                        })
                        .eq('id', payment.bill_id);
                }
            }

            // Log debit transaction
            if (payment.tenant_id) {
                await supabaseAdmin.from('transactions').insert({
                    tenant_id: payment.tenant_id,
                    type: 'debit',
                    amount: payment.amount,
                    reference: payment.transaction_reference,
                    description: `Rent payment via Bank Transfer (Approved)`,
                    status: 'success'
                });

                // Notify Tenant
                await supabaseAdmin.rpc('create_notification', {
                    p_user_id: payment.tenant_id,
                    p_type: 'rent_paid',
                    p_title: 'Bank Transfer Approved',
                    p_message: `Landlord approved your bank transfer of ₦${Number(payment.amount).toLocaleString()} for "${payment.property?.title || 'Property'}".`,
                    p_link: '/dashboard/rent-payments'
                });
            }
        } 
        
        else if (action === 'reject') {
            // Update payment record to Failed
            const { error: updateError } = await supabaseAdmin
                .from('rent_payments')
                .update({
                    payment_status: 'Failed'
                })
                .eq('id', paymentId);

            if (updateError) throw updateError;

            // If linked to a bill, revert status from 'processing' to 'pending' or 'overdue'
            if (payment.bill_id) {
                const { data: bill } = await supabaseAdmin
                    .from('bills')
                    .select('due_date')
                    .eq('id', payment.bill_id)
                    .maybeSingle();

                if (bill) {
                    const dueDateTime = new Date(bill.due_date).getTime();
                    const newStatus = dueDateTime < Date.now() ? 'overdue' : 'pending';

                    await supabaseAdmin
                        .from('bills')
                        .update({ status: newStatus })
                        .eq('id', payment.bill_id);
                }
            }

            // Notify Tenant
            if (payment.tenant_id) {
                await supabaseAdmin.rpc('create_notification', {
                    p_user_id: payment.tenant_id,
                    p_type: 'rent_rejected',
                    p_title: 'Bank Transfer Rejected',
                    p_message: `Landlord declined your bank transfer of ₦${Number(payment.amount).toLocaleString()} for "${payment.property?.title || 'Property'}". ${rejectionReason ? 'Reason: ' + rejectionReason : ''}`,
                    p_link: '/dashboard/rent-payments'
                });
            }
        } 
        
        else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: `Payment transfer successfully ${action}d` });

    } catch (error: any) {
        console.error('Approve transfer error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
