import { NextResponse } from "next/server"
import { getCurrentUserWithRole } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"

const BILL_TYPES = new Set(["rent", "electricity", "water", "waste", "gas", "service", "custom"])
const ACTIVE_RENTAL_STATUSES = ["approved", "active", "accepted"]

const cleanText = (value: unknown, max: number) =>
    typeof value === "string" ? value.trim().replace(/[<>]/g, "").slice(0, max) : ""

export async function GET() {
    const currentUser = await getCurrentUserWithRole()
    if (!currentUser) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    if (currentUser.role !== "landlord") return NextResponse.json({ error: "Landlord access required" }, { status: 403 })

    const { data, error } = await supabaseAdmin
        .from("rentals")
        .select("id, tenant_id, property_id, status, tenant:profiles!rentals_tenant_id_fkey(name, full_name, email), property:properties!rentals_property_id_fkey(title)")
        .eq("landlord_id", currentUser.user.id)
        .in("status", ACTIVE_RENTAL_STATUSES)
        .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: "Unable to load connected tenants" }, { status: 500 })
    return NextResponse.json({ rentals: data || [] })
}

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUserWithRole()
        if (!currentUser) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        if (currentUser.role !== "landlord") return NextResponse.json({ error: "Landlord access required" }, { status: 403 })

        const body = await request.json().catch(() => ({}))
        const rentalId = cleanText(body.rentalId, 100)
        const type = cleanText(body.type, 32).toLowerCase()
        const amount = Number(body.amount)
        const dueDate = cleanText(body.dueDate, 10)
        const description = cleanText(body.description, 500)
        const billingPeriod = cleanText(body.billingPeriod, 80)

        if (!rentalId || !BILL_TYPES.has(type)) return NextResponse.json({ error: "Choose a connected tenant and valid bill type" }, { status: 400 })
        if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) return NextResponse.json({ error: "Enter a valid bill amount" }, { status: 400 })
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(Date.parse(dueDate))) return NextResponse.json({ error: "Enter a valid due date" }, { status: 400 })

        const { data: rental } = await supabaseAdmin
            .from("rentals")
            .select("id, tenant_id, landlord_id, property:properties!rentals_property_id_fkey(title)")
            .eq("id", rentalId)
            .eq("landlord_id", currentUser.user.id)
            .in("status", ACTIVE_RENTAL_STATUSES)
            .maybeSingle()
        if (!rental) return NextResponse.json({ error: "This tenant is not connected to your property" }, { status: 403 })

        const { data: bill, error } = await supabaseAdmin.from("bills").insert({
            rental_id: rental.id,
            type,
            amount,
            amount_paid: 0,
            due_date: dueDate,
            status: "pending",
            description: description || null,
            billing_period: billingPeriod || null,
            created_by: currentUser.user.id,
        }).select("id, type, amount, due_date, status").single()
        if (error) throw error

        const property = Array.isArray(rental.property) ? rental.property[0] : rental.property
        await supabaseAdmin.from("notifications").insert({
            user_id: rental.tenant_id,
            type: "bill_created",
            title: `New ${type} bill`,
            message: `A $${amount.toLocaleString("en-US")} ${type} bill for "${property?.title || "your property"}" is due on ${new Date(dueDate + "T00:00:00").toLocaleDateString("en-US")}. You may pay before the due date.`,
            link: `/pay-bills?billId=${bill.id}`,
        })

        return NextResponse.json({ bill, message: "Bill created and tenant notified" }, { status: 201 })
    } catch (error) {
        console.error("Create bill error:", error)
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create bill" }, { status: 500 })
    }
}
