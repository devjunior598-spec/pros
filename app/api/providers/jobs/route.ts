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

        const { data: jobs, error } = await supabaseAdmin
            .from("provider_jobs")
            .select(`
                *,
                ticket:maintenance_tickets(*),
                tenant:profiles!tenant_id(name, email, phone),
                property:properties!property_id(title, address)
            `)
            .eq("provider_id", user.id)
            .order("created_at", { ascending: false })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ jobs })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to fetch provider jobs" }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authErr } = await supabase.auth.getUser()

        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { jobId, action, providerNotes } = body

        if (!jobId || !action) {
            return NextResponse.json({ error: "Missing jobId or action" }, { status: 400 })
        }

        const nowIso = new Date().toISOString()
        const updateData: any = { updated_at: nowIso }

        if (action === "accept") {
            updateData.status = "Accepted"
            updateData.accepted_at = nowIso
        } else if (action === "start_travel") {
            updateData.status = "Travelling"
            updateData.travel_started_at = nowIso
        } else if (action === "arrive") {
            updateData.status = "Arrived"
            updateData.arrived_at = nowIso
        } else if (action === "start_work") {
            updateData.status = "Working"
            updateData.work_started_at = nowIso
        } else if (action === "complete") {
            updateData.status = "Completed"
            updateData.completed_at = nowIso
            updateData.provider_notes = providerNotes || ""
        }

        const { data: job, error } = await supabaseAdmin
            .from("provider_jobs")
            .update(updateData)
            .eq("id", jobId)
            .eq("provider_id", user.id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Sync ticket status
        let ticketStatus = "Assigned"
        if (action === "accept") ticketStatus = "Accepted"
        else if (action === "start_travel") ticketStatus = "Technician On The Way"
        else if (action === "start_work") ticketStatus = "In Progress"
        else if (action === "complete") ticketStatus = "Completed"

        await supabaseAdmin.from("maintenance_tickets").update({ status: ticketStatus, updated_at: nowIso }).eq("id", job.ticket_id)

        return NextResponse.json({ job, message: `Job updated to ${updateData.status}` })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to update job status" }, { status: 500 })
    }
}
