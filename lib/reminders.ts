import { supabaseAdmin } from "@/lib/supabase-admin"
import { createNotification } from "@/lib/notifications"
import { sendEmail, buildEmailTemplate } from "@/lib/email"
import { formatCurrency } from "@/lib/utils"

export async function processPaymentReminders() {
    // Fetch active/due payment schedules
    const { data: schedules, error } = await supabaseAdmin
        .from("payment_schedules")
        .select(`
            *,
            tenant:profiles!tenant_id(id, name, email),
            landlord:profiles!landlord_id(id, name, email),
            property:properties!property_id(title, address)
        `)
        .in("status", ["Upcoming", "Due", "Overdue"])

    if (error || !schedules) {
        console.error("Error fetching schedules for reminders:", error)
        return { processed: 0, errors: [error?.message] }
    }

    const now = new Date()
    let sentCount = 0

    for (const schedule of schedules) {
        if (!schedule.tenant?.email) continue

        const dueDate = new Date(schedule.due_date)
        const diffMs = dueDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

        let reminderType: string | null = null
        if (diffDays === 30) reminderType = "30_days_before"
        else if (diffDays === 14) reminderType = "14_days_before"
        else if (diffDays === 7) reminderType = "7_days_before"
        else if (diffDays === 3) reminderType = "3_days_before"
        else if (diffDays === 1) reminderType = "1_day_before"
        else if (diffDays === 0) reminderType = "due_today"
        else if (diffDays === -1) reminderType = "1_day_overdue"
        else if (diffDays === -7) reminderType = "7_days_overdue"
        else if (diffDays === -14) reminderType = "14_days_overdue"
        else if (diffDays === -30) reminderType = "30_days_overdue"

        if (!reminderType) continue

        // Prevent duplicate reminder
        const { data: existing } = await supabaseAdmin
            .from("reminder_logs")
            .select("id")
            .eq("payment_schedule_id", schedule.id)
            .eq("reminder_type", reminderType)
            .single()

        if (existing) continue

        // Send In-App Notification
        const isOverdue = diffDays < 0
        const title = isOverdue
            ? `RENT OVERDUE: ${schedule.description}`
            : `Rent Reminder: ${schedule.description}`
        const message = isOverdue
            ? `Your payment of ${formatCurrency(schedule.outstanding_amount)} for ${schedule.property?.title} is ${Math.abs(diffDays)} day(s) overdue.`
            : `Reminder: Your payment of ${formatCurrency(schedule.outstanding_amount)} for ${schedule.property?.title} is due in ${diffDays} day(s).`

        await createNotification({
            userId: schedule.tenant_id,
            type: "payment_reminder",
            title,
            message,
            link: "/dashboard/tenant/payments",
        })

        // Send Email
        const emailHtml = buildEmailTemplate({
            title,
            recipientName: schedule.tenant.name,
            message,
            ctaText: "Pay Rent Now",
            ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/tenant/payments`,
        })

        await sendEmail({
            to: schedule.tenant.email,
            subject: title,
            html: emailHtml,
        })

        // Log reminder
        await supabaseAdmin.from("reminder_logs").insert({
            payment_schedule_id: schedule.id,
            tenant_id: schedule.tenant_id,
            reminder_type: reminderType,
            channel: "in_app_and_email",
        })

        sentCount++
    }

    return { processed: sentCount }
}
