import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getCurrentUserWithRole } from "@/lib/supabase-server"

const bookingSelect = "*, property:properties(title, city, state)"

export async function GET() {
    try {
        const currentUser = await getCurrentUserWithRole()
        if (!currentUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }
        if (currentUser.role !== "landlord") {
            return NextResponse.json({ error: "Only landlords can view inspections" }, { status: 403 })
        }

        const landlordId = currentUser.user.id
        const { data: ownedProperties, error: propertiesError } = await supabaseAdmin
            .from("properties")
            .select("id")
            .eq("landlord_id", landlordId)

        if (propertiesError) throw propertiesError

        const propertyIds = (ownedProperties || []).map((property) => property.id)
        const landlordQuery = supabaseAdmin
            .from("inspection_bookings")
            .select(bookingSelect)
            .eq("landlord_id", landlordId)
        const propertyQuery = propertyIds.length > 0
            ? supabaseAdmin
                .from("inspection_bookings")
                .select(bookingSelect)
                .in("property_id", propertyIds)
            : null

        const [landlordResult, propertyResult] = await Promise.all([
            landlordQuery,
            propertyQuery || Promise.resolve({ data: [], error: null }),
        ])

        if (landlordResult.error) throw landlordResult.error
        if (propertyResult.error) throw propertyResult.error

        const bookingsById = new Map<string, (typeof landlordResult.data)[number]>()
        for (const booking of [
            ...(landlordResult.data || []),
            ...(propertyResult.data || []),
        ]) {
            bookingsById.set(booking.id, booking)
        }

        const { data: availability } = await supabaseAdmin
            .from("landlord_availabilities")
            .select("*")
            .eq("landlord_id", landlordId)
            .maybeSingle()

        return NextResponse.json({
            bookings: [...bookingsById.values()].sort((left, right) => {
                const leftKey = `${left.inspection_date}T${left.inspection_time}`
                const rightKey = `${right.inspection_date}T${right.inspection_time}`
                return leftKey.localeCompare(rightKey)
            }),
            availability: availability || null,
        })
    } catch (error: unknown) {
        console.error("Landlord inspections API error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to load inspections" },
            { status: 500 },
        )
    }
}
