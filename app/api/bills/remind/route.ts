import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getCurrentUserWithRole } from "@/lib/supabase-server"

import { getBillDaysUntilDue } from "@/lib/bill-dates"

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUserWithRole()
        if (!currentUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }
        if (currentUser.role !== "landlord") {
            return NextResponse.json({ error: "Only landlords can send bill reminders" }, { status: 403 })
        }

        const body = await request.json().catch(() => ({}))
        const billId = body?.billId
        if (typeof billId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(billId)) {
            return NextResponse.json({ error: "A bill is required" }, { status: 400 })
        }

        const { data: bill, error: billError } = await supabaseAdmin
            .from("bills")
            .select(`
                id,
                type,
                amount,
                amount_paid,
                due_date,
                status,
                rental:rentals!inner (
                    tenant_id,
                    landlord_id,
                    property:properties (title)
                )
            `)
            .eq("id", billId)
            .eq("rental.landlord_id", currentUser.user.id)
            .maybeSingle()

        if (billError) throw billError
        if (!bill) {
            return NextResponse.json({ error: "Bill not found" }, { status: 404 })
        }
        if (bill.status === "paid") {
            return NextResponse.json({ error: "This bill has already been paid" }, { status: 400 })
        }

        const rental = Array.isArray(bill.rental) ? bill.rental[0] : bill.rental
        if (!rental?.tenant_id) {
            return NextResponse.json({ error: "This bill has no assigned tenant" }, { status: 400 })
        }

        const property = Array.isArray(rental.property) ? rental.property[0] : rental.property
        const propertyTitle = property?.title || "your rental property"
        const outstanding = Math.max(0, Number(bill.amount) - Number(bill.amount_paid || 0))
        if (!Number.isFinite(outstanding) || outstanding <= 0) {
            return NextResponse.json({ error: "This bill has no outstanding balance" }, { status: 400 })
        }
        const daysUntilDue = bill.due_date ? getBillDaysUntilDue(bill.due_date) : NaN
        if (!Number.isFinite(daysUntilDue)) {
            return NextResponse.json({ error: "Set a valid due date before sending a reminder" }, { status: 400 })
        }

        let title: string
        let timing: string
        if (daysUntilDue < 0) {
            const daysOverdue = Math.abs(daysUntilDue)
            title = `${bill.type} bill overdue`
            timing = `${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue`
        } else if (daysUntilDue === 0) {
            title = `${bill.type} bill due today`
            timing = "due today"
        } else {
            title = `${bill.type} bill due soon`
            timing = `due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`
        }

        const message = `Your landlord is reminding you that the outstanding $${outstanding.toLocaleString("en-US")} ${bill.type} bill for "${propertyTitle}" is ${timing} (${bill.due_date}). Open this bill to pay now by wallet, card, or bank transfer. You can pay before or on the due date, or settle it now if overdue.`

        const { error: notificationError } = await supabaseAdmin
            .from("notifications")
            .insert({
                user_id: rental.tenant_id,
                type: "bill_reminder",
                title,
                message,
                link: `/pay-bills?billId=${bill.id}`,
            })

        if (notificationError) throw notificationError

        return NextResponse.json({ success: true, message: "Reminder sent to the tenant" })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unable to send bill reminder"
        console.error("Bill reminder error:", error)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
