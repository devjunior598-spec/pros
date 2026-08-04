import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getCurrentUserWithRole } from "@/lib/supabase-server"

const rentalSelect = `
    *,
    property:properties!property_id (
        id,
        title,
        address,
        landlord_id
    ),
    tenant:profiles!rentals_tenant_id_fkey (
        id,
        name,
        full_name,
        email,
        phone
    )
`

export async function GET(request: Request) {
    try {
        const currentUser = await getCurrentUserWithRole()
        if (!currentUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }
        if (currentUser.role !== "landlord") {
            return NextResponse.json({ error: "Only landlords can view applications" }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const statusFilter = searchParams.get("status")

        const landlordId = currentUser.user.id
        const { data: ownedProperties, error: propertiesError } = await supabaseAdmin
            .from("properties")
            .select("id")
            .eq("landlord_id", landlordId)

        if (propertiesError) throw propertiesError

        const propertyIds = (ownedProperties || []).map((property) => property.id)

        let landlordQuery = supabaseAdmin
            .from("rentals")
            .select(rentalSelect)
            .eq("landlord_id", landlordId)
            .order("created_at", { ascending: false })

        if (statusFilter && statusFilter !== "all") {
            landlordQuery = landlordQuery.eq("status", statusFilter)
        }

        let propertyQuery = propertyIds.length > 0
            ? supabaseAdmin
                .from("rentals")
                .select(rentalSelect)
                .in("property_id", propertyIds)
                .order("created_at", { ascending: false })
            : null

        if (propertyQuery && statusFilter && statusFilter !== "all") {
            propertyQuery = propertyQuery.eq("status", statusFilter)
        }

        const [landlordResult, propertyResult] = await Promise.all([
            landlordQuery,
            propertyQuery || Promise.resolve({ data: [], error: null }),
        ])

        if (landlordResult.error) throw landlordResult.error
        if (propertyResult.error) throw propertyResult.error

        const applicationsById = new Map<string, (typeof landlordResult.data)[number]>()
        for (const application of [
            ...(landlordResult.data || []),
            ...(propertyResult.data || []),
        ]) {
            applicationsById.set(application.id, application)
        }

        const applications = [...applicationsById.values()]
        const tenantIds = [...new Set(applications.map((application) => application.tenant_id).filter(Boolean))]
        const applicationPropertyIds = [...new Set(applications.map((application) => application.property_id).filter(Boolean))]
        const inspectionResult = tenantIds.length > 0 && applicationPropertyIds.length > 0
            ? await supabaseAdmin
                .from("inspection_bookings")
                .select("*")
                .in("property_id", applicationPropertyIds)
                .in("tenant_id", tenantIds)
                .order("inspection_date", { ascending: false })
            : { data: [], error: null }

        if (inspectionResult.error) throw inspectionResult.error

        const inspectionsByApplicant = new Map<string, (typeof inspectionResult.data)[number]>()
        for (const inspection of inspectionResult.data || []) {
            const key = `${inspection.property_id}_${inspection.tenant_id}`
            if (!inspectionsByApplicant.has(key)) {
                inspectionsByApplicant.set(key, inspection)
            }
        }

        return NextResponse.json({
            applications: applications.map((application) => ({
                ...application,
                inspection: inspectionsByApplicant.get(`${application.property_id}_${application.tenant_id}`) || null,
            })),
        })
    } catch (error: unknown) {
        console.error("Landlord applications API error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to load applications" },
            { status: 500 },
        )
    }
}
