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

        const { searchParams } = new URL(req.url)
        const role = searchParams.get("role") || "user"

        let query = supabaseAdmin.from("support_tickets").select("*, user:profiles!user_id(name, email), agent:profiles!assigned_agent_id(name, email)").order("created_at", { ascending: false })

        if (role === "agent") {
            // Agent views open or assigned
        } else {
            query = query.eq("user_id", user.id)
        }

        const { data: tickets, error } = await query
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ tickets })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to fetch support tickets" }, { status: 500 })
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
        const { subject, description, category, priority, department, channel } = body

        if (!subject || !description || !category) {
            return NextResponse.json({ error: "Missing required support fields" }, { status: 400 })
        }

        const randomNum = Math.floor(100000 + Math.random() * 900000)
        const ticketNumber = `PRMS-SUP-${randomNum}`

        const { data: ticket, error } = await supabaseAdmin
            .from("support_tickets")
            .insert({
                ticket_number: ticketNumber,
                user_id: user.id,
                channel: channel || "Portal",
                category,
                priority: priority || "Medium",
                department: department || "General",
                subject,
                description,
                status: "Open"
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ ticket, message: "Support ticket opened successfully" })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to create support ticket" }, { status: 500 })
    }
}
