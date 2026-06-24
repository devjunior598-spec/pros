import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
    try {
        // Fetch unpaid bills
        const { data: bills, error: billsError } = await supabaseAdmin
            .from('bills')
            .select(`
                id,
                amount,
                due_date,
                status,
                rental:rentals (
                    tenant_id,
                    property:properties (
                        id,
                        title
                    )
                )
            `)
            .neq('status', 'paid')
            .neq('status', 'processing');

        if (billsError) throw billsError;

        let remindersCount = 0;
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        for (const bill of (bills || [])) {
            const rental = (bill as any).rental;
            if (!rental || !rental.tenant_id) continue;

            const tenantId = rental.tenant_id;
            const propertyTitle = rental.property?.title || 'your rental property';
            const dueDate = new Date(bill.due_date);
            dueDate.setHours(0, 0, 0, 0);

            const diffTime = dueDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let sendReminder = false;
            let messageTitle = '';
            let messageContent = '';

            if (diffDays === 30) {
                sendReminder = true;
                messageTitle = 'Rent Due in 30 Days';
                messageContent = `Your rent of ₦${Number(bill.amount).toLocaleString()} for "${propertyTitle}" is due in 30 days (${bill.due_date}).`;
            } else if (diffDays === 14) {
                sendReminder = true;
                messageTitle = 'Rent Due in 14 Days';
                messageContent = `Friendly reminder: your rent of ₦${Number(bill.amount).toLocaleString()} for "${propertyTitle}" is due in 14 days (${bill.due_date}).`;
            } else if (diffDays === 7) {
                sendReminder = true;
                messageTitle = 'Rent Due in 7 Days';
                messageContent = `Urgent reminder: your rent of ₦${Number(bill.amount).toLocaleString()} for "${propertyTitle}" is due in 7 days (${bill.due_date}).`;
            } else if (diffDays === 0) {
                sendReminder = true;
                messageTitle = 'Rent Due Today';
                messageContent = `Your rent of ₦${Number(bill.amount).toLocaleString()} for "${propertyTitle}" is due today. Please pay as soon as possible.`;
            } else if (diffDays < 0) {
                // If overdue, update status to overdue in DB
                if (bill.status !== 'overdue') {
                    await supabaseAdmin
                        .from('bills')
                        .update({ status: 'overdue' })
                        .eq('id', bill.id);
                }

                // Send reminder every 3 days if overdue
                const daysOverdue = Math.abs(diffDays);
                if (daysOverdue % 3 === 0) {
                    sendReminder = true;
                    messageTitle = 'Rent Overdue Alert';
                    messageContent = `Your rent of ₦${Number(bill.amount).toLocaleString()} for "${propertyTitle}" is ${daysOverdue} days overdue. Please settle this immediately.`;
                }
            }

            if (sendReminder) {
                await supabaseAdmin.rpc('create_notification', {
                    p_user_id: tenantId,
                    p_type: 'payment_reminder',
                    p_title: messageTitle,
                    p_message: messageContent,
                    p_link: '/dashboard/rent-payments'
                });
                remindersCount++;
            }
        }

        return NextResponse.json({ success: true, remindersSent: remindersCount });

    } catch (error: any) {
        console.error('Payment reminders cron error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
