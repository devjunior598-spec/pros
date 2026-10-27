import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authErr } = await supabase.auth.getUser()

        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: refunds, error } = await supabaseAdmin
            .from("refunds")
            .select(`
                *,
                tenant:profiles!tenant_id(name, email),
                landlord:profiles!landlord_id(name, email),
                payment:payments(*)
            `)
            .or(`landlord_id.eq.${user.id},tenant_id.eq.${user.id}`)
            .order("created_at", { ascending: false })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ refunds })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to fetch refunds" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authErr } = await supabase.auth.getUser()

        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { paymentId, landlordId, tenantId, amount, reason, notes } = body

        if (!amount || !reason) {
            return NextResponse.json({ error: "Missing refund details" }, { status: 400 })
        }

        const { data: refund, error } = await supabaseAdmin
            .from("refunds")
            .insert({
                payment_id: paymentId || null,
                landlord_id: landlordId || user.id,
                tenant_id: tenantId || user.id,
                amount: Number(amount),
                reason,
                notes: notes || "",
                status: "Requested"
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ refund, message: "Refund request submitted" })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to submit refund" }, { status: 500 })
    }
}
