import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
    const { response } = await requireAdmin()
    if (response) return response

    try {
        const { data: disputes, error } = await supabaseAdmin
            .from("disputes")
            .select(`
                *,
                party1:profiles!disputes_party1_id_fkey(id, name, full_name, email, role),
                party2:profiles!disputes_party2_id_fkey(id, name, full_name, email, role)
            `)
            .order("created_at", { ascending: false })

        if (error && !error.message?.includes("relation")) {
            console.warn("Disputes table query warning:", error.message)
        }

        return NextResponse.json({ disputes: disputes || [] })
    } catch (error: unknown) {
        console.error("GET /api/admin/disputes error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to load disputes" },
            { status: 500 }
        )
    }
}

export async function PATCH(request: Request) {
    const { response, currentUser } = await requireAdmin()
    if (response) return response

    try {
        const { id, status, resolution_notes, priority } = await request.json()

        if (!id) {
            return NextResponse.json({ error: "Dispute ID is required" }, { status: 400 })
        }

        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString(),
        }

        if (status) updateData.status = status
        if (resolution_notes !== undefined) updateData.resolution_notes = resolution_notes
        if (priority) updateData.priority = priority
        if (status === "resolved" || status === "closed") {
            updateData.resolved_at = new Date().toISOString()
            updateData.resolved_by = currentUser?.user.id
        }

        const { data, error } = await supabaseAdmin
            .from("disputes")
            .update(updateData)
            .eq("id", id)
            .select()
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({
            dispute: data,
            message: `Dispute updated to status: ${status}`,
        })
    } catch (error: unknown) {
        console.error("PATCH /api/admin/disputes error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update dispute" },
            { status: 500 }
        )
    }
}
