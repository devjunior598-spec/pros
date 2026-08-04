import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getCurrentUserWithRole } from "@/lib/supabase-server"

type RentalAuthorization = {
    landlord_id: string
    tenant_id: string
    property_id: string
    property?: { title?: string } | null
}

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUserWithRole()
        if (!currentUser) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        if (currentUser.role !== "landlord") return NextResponse.json({ error: "Only landlords can approve bank transfers" }, { status: 403 })

        const body = await request.json().catch(() => ({}))
        const paymentId = typeof body.paymentId === "string" ? body.paymentId : ""
        const action = body.action === "approve" || body.action === "reject" ? body.action : null
        const rejectionReason = typeof body.rejectionReason === "string" ? body.rejectionReason.trim() : ""
        if (!paymentId || !action) return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })

        const { data: payment, error: paymentError } = await supabaseAdmin
            .from("rent_payments")
            .select("*")
            .eq("id", paymentId)
            .maybeSingle()
        if (paymentError || !payment) return NextResponse.json({ error: "Payment record not found" }, { status: 404 })
        if (payment.landlord_id !== currentUser.user.id) return NextResponse.json({ error: "You cannot process this payment" }, { status: 403 })
        if (payment.payment_status !== "Pending") return NextResponse.json({ error: "This payment has already been processed." }, { status: 400 })

        const { data: rentalData } = await supabaseAdmin
            .from("rentals")
            .select("landlord_id, tenant_id, property_id, property:properties!rentals_property_id_fkey(title)")
            .eq("landlord_id", currentUser.user.id)
            .eq("tenant_id", payment.tenant_id)
            .eq("property_id", payment.property_id)
            .maybeSingle()
        const rental = rentalData as unknown as RentalAuthorization | null
        if (!rental) return NextResponse.json({ error: "The linked rental could not be verified" }, { status: 403 })

        if (action === "approve") {
            const receiptNumber = payment.receipt_number || `RCP-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${payment.id.slice(0, 8)}`.toUpperCase()
            const { error: updateError } = await supabaseAdmin.from("rent_payments").update({
                payment_status: "Paid", payment_date: new Date().toISOString(), receipt_number: receiptNumber,
            }).eq("id", payment.id).eq("payment_status", "Pending")
            if (updateError) throw updateError

            if (payment.bill_id) {
                const [{ data: bill }, { data: paidRows }] = await Promise.all([
                    supabaseAdmin.from("bills").select("amount").eq("id", payment.bill_id).maybeSingle(),
                    supabaseAdmin.from("rent_payments").select("amount").eq("bill_id", payment.bill_id).eq("payment_status", "Paid"),
                ])
                if (bill) {
                    const amountPaid = (paidRows || []).reduce((sum, row) => sum + Number(row.amount), 0)
                    const paidInFull = amountPaid >= Number(bill.amount)
                    await supabaseAdmin.from("bills").update({ amount_paid: amountPaid, status: paidInFull ? "paid" : "partially_paid", paid_at: paidInFull ? new Date().toISOString() : null }).eq("id", payment.bill_id)
                }
            }

            await supabaseAdmin.from("transactions").insert({ tenant_id: rental.tenant_id, type: "debit", amount: payment.amount, reference: payment.transaction_reference, description: "Rent payment via Bank Transfer (Approved)", status: "success" })
            await supabaseAdmin.rpc("create_notification", { p_user_id: rental.tenant_id, p_type: "rent_paid", p_title: "Bank Transfer Approved", p_message: `Your transfer of ₦${Number(payment.amount).toLocaleString()} for "${rental.property?.title || "Property"}" was approved.`, p_link: "/payments" })
        } else {
            const { error: updateError } = await supabaseAdmin.from("rent_payments").update({ payment_status: "Failed" }).eq("id", payment.id).eq("payment_status", "Pending")
            if (updateError) throw updateError
            if (payment.bill_id) {
                const { data: bill } = await supabaseAdmin.from("bills").select("due_date").eq("id", payment.bill_id).maybeSingle()
                if (bill) await supabaseAdmin.from("bills").update({ status: new Date(bill.due_date).getTime() < Date.now() ? "overdue" : "unpaid" }).eq("id", payment.bill_id)
            }
            await supabaseAdmin.rpc("create_notification", { p_user_id: rental.tenant_id, p_type: "rent_rejected", p_title: "Bank Transfer Rejected", p_message: `Your transfer of ₦${Number(payment.amount).toLocaleString()} for "${rental.property?.title || "Property"}" was declined.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`, p_link: "/payments" })
        }

        return NextResponse.json({ success: true, message: action === "approve" ? "Payment approved" : "Payment rejected" })
    } catch (error) {
        console.error("Approve transfer error:", error)
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 })
    }
}
