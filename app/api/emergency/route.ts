import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { createNotification } from "@/lib/notifications"

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authErr } = await supabase.auth.getUser()

        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { propertyId, emergencyType, locationNotes } = body

        if (!propertyId || !emergencyType) {
            return NextResponse.json({ error: "Missing emergency type or property ID" }, { status: 400 })
        }

        const { data: alert, error } = await supabaseAdmin
            .from("emergency_alerts")
            .insert({
                user_id: user.id,
                property_id: propertyId,
                emergency_type: emergencyType,
                location_notes: locationNotes || "",
                status: "Dispatched"
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Create urgent notifications for landlords, operations, and support
        const { data: property } = await supabaseAdmin.from("properties").select("landlord_id, title").eq("id", propertyId).single()

        if (property?.landlord_id) {
            await createNotification({
                userId: property.landlord_id,
                type: "emergency_alert",
                title: `🚨 EMERGENCY HOTLINE ALERT: ${emergencyType.toUpperCase()}`,
                message: `Emergency reported at ${property.title}. Location notes: ${locationNotes || "Immediate assistance requested"}.`,
                link: "/dashboard/landlord/maintenance"
            })
        }

        return NextResponse.json({ alert, message: `Emergency ${emergencyType} alert dispatched to rapid response team.` })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to dispatch emergency alert" }, { status: 500 })
    }
}
