import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getCurrentUserWithRole } from "@/lib/supabase-server"

type TenantProfile = {
    id: string
    name: string | null
    full_name: string | null
    email: string | null
}

export async function GET() {
    try {
        const currentUser = await getCurrentUserWithRole()

        if (!currentUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        if (currentUser.role !== "landlord") {
            return NextResponse.json({ error: "Only landlords can create lease agreements" }, { status: 403 })
        }

        const landlordId = currentUser.user.id
        const { data: properties, error: propertiesError } = await supabaseAdmin
            .from("properties")
            .select("id, title, address, status")
            .eq("landlord_id", landlordId)
            .order("created_at", { ascending: false })

        if (propertiesError) throw propertiesError

        const propertyIds = (properties || []).map((property) => property.id)
        if (propertyIds.length === 0) {
            return NextResponse.json({ properties: [], tenantAssignments: [] })
        }

        const { data: rentals, error: rentalsError } = await supabaseAdmin
            .from("rentals")
            .select("id, property_id, tenant_id, status")
            .eq("landlord_id", landlordId)
            .in("property_id", propertyIds)
            .in("status", ["approved", "active"])

        if (rentalsError) throw rentalsError

        const tenantIds = [...new Set((rentals || []).map((rental) => rental.tenant_id).filter(Boolean))]
        let tenantProfiles: TenantProfile[] = []

        if (tenantIds.length > 0) {
            const { data: profiles, error: profilesError } = await supabaseAdmin
                .from("profiles")
                .select("id, name, full_name, email")
                .in("id", tenantIds)
                .eq("role", "tenant")

            if (profilesError) throw profilesError
            tenantProfiles = (profiles || []) as TenantProfile[]
        }

        const profilesById = new Map(tenantProfiles.map((profile) => [profile.id, profile]))
        const tenantAssignments = (rentals || []).flatMap((rental) => {
            const tenant = profilesById.get(rental.tenant_id)
            if (!tenant) return []

            return [{
                rentalId: rental.id,
                propertyId: rental.property_id,
                tenant,
            }]
        })

        return NextResponse.json({
            properties: properties || [],
            tenantAssignments,
        })
    } catch (error) {
        console.error("Lease options API error:", error)
        return NextResponse.json({ error: "Failed to load lease options" }, { status: 500 })
    }
}
