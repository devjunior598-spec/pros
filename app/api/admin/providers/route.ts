import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
    const { response } = await requireAdmin()
    if (response) return response

    try {
        const { data: providers, error } = await supabaseAdmin
            .from("service_providers")
            .select(`
                *,
                user:profiles(id, name, full_name, email, phone_number)
            `)
            .order("created_at", { ascending: false })

        if (error && !error.message?.includes("relation")) {
            console.warn("Service providers query warning:", error.message)
        }

        return NextResponse.json({ providers: providers || [] })
    } catch (error: unknown) {
        console.error("GET /api/admin/providers error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch service providers" },
            { status: 500 }
        )
    }
}

export async function PATCH(request: Request) {
    const { response } = await requireAdmin()
    if (response) return response

    try {
        const { id, approval_status, notes } = await request.json()

        if (!id) {
            return NextResponse.json({ error: "Provider ID is required" }, { status: 400 })
        }

        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString(),
        }

        if (approval_status) updateData.approval_status = approval_status
        if (notes !== undefined) updateData.admin_notes = notes

        const { data, error } = await supabaseAdmin
            .from("service_providers")
            .update(updateData)
            .eq("id", id)
            .select(`
                *,
                user:profiles(id, name, full_name, email, phone_number)
            `)
            .single()

        if (error) throw error

        return NextResponse.json({
            provider: data,
            message: `Service provider status updated to ${approval_status}`,
        })
    } catch (error: unknown) {
        console.error("PATCH /api/admin/providers error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update service provider status" },
            { status: 500 }
        )
    }
}
