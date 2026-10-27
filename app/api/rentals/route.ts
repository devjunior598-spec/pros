import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserWithRole } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(req: NextRequest) {
    try {
        const currentUser = await getCurrentUserWithRole()
        if (!currentUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const role = searchParams.get("role") || currentUser.role
        const status = searchParams.get("status")

        let query = supabaseAdmin
            .from("rentals")
            .select(`
                id,
                property_id,
                tenant_id,
                landlord_id,
                rent_amount,
                rent_start_date,
                status,
                created_at,
                employment,
                income,
                notes,
                application_letter,
                application_letter_url,
                property:properties!rentals_property_id_fkey(id, title, address, city, state, price),
                tenant:profiles!rentals_tenant_id_fkey(id, name, full_name, email, phone)
            `)
            .order("created_at", { ascending: false })

        if (role === "tenant") {
            query = query.eq("tenant_id", currentUser.user.id)
        } else if (role === "landlord") {
            if (currentUser.role !== "landlord" && currentUser.role !== "admin") {
                return NextResponse.json({ error: "Only landlords can view landlord rentals" }, { status: 403 })
            }
            query = query.eq("landlord_id", currentUser.user.id)
        } else if (role === "admin" && currentUser.role === "admin") {
            // Admin sees all rentals.
        } else {
            return NextResponse.json({ error: "Invalid rentals view" }, { status: 400 })
        }

        if (status && status !== "all") {
            query = query.eq("status", status)
        }

        const { data, error } = await query
        if (error) throw error

        return NextResponse.json({ rentals: data || [] })
    } catch (error) {
        console.error("Rentals API error:", error)
        return NextResponse.json({ error: "Failed to load rentals" }, { status: 500 })
    }
}
