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

        const { data: disputes, error } = await supabaseAdmin
            .from("payment_disputes")
            .select(`
                *,
                opened_by_user:profiles!opened_by(name, email),
                payment:payments(*)
            `)
            .order("created_at", { ascending: false })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ disputes })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to fetch disputes" }, { status: 500 })
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
        const { paymentId, category, description, evidence } = body

        if (!category || !description) {
            return NextResponse.json({ error: "Missing dispute category or description" }, { status: 400 })
        }

        const { data: dispute, error } = await supabaseAdmin
            .from("payment_disputes")
            .insert({
                payment_id: paymentId || null,
                opened_by: user.id,
                category,
                description,
                evidence: evidence || [],
                status: "Open"
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ dispute, message: "Dispute opened successfully" })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to open dispute" }, { status: 500 })
    }
}
