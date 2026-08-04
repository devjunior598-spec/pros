import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getCurrentUserWithRole } from "@/lib/supabase-server"

type ApplicationBody = {
    propertyId?: string
    employment?: string
    income?: string
    notes?: string
    applicationLetter?: string
    applicationLetterUrl?: string
    rentStartDate?: string | null
}

type TenantProfile = {
    name?: string | null
    fullname?: string | null
    full_name?: string | null
}

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUserWithRole()
        if (!currentUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }
        if (currentUser.role !== "tenant") {
            return NextResponse.json({ error: "Only tenants can submit rental applications" }, { status: 403 })
        }

        const body = (await request.json()) as ApplicationBody
        if (!body.propertyId) {
            return NextResponse.json({ error: "Property is required" }, { status: 400 })
        }

        const { data: property, error: propertyError } = await supabaseAdmin
            .from("properties")
            .select("id, title, landlord_id, price, status")
            .eq("id", body.propertyId)
            .maybeSingle()

        if (propertyError) throw propertyError
        if (!property || !property.landlord_id) {
            return NextResponse.json({ error: "Property not found" }, { status: 404 })
        }
        if (property.status !== "available") {
            return NextResponse.json({ error: "This property is not accepting applications" }, { status: 400 })
        }

        const tenantId = currentUser.user.id
        const { data: existingApplication, error: existingError } = await supabaseAdmin
            .from("rentals")
            .select("id")
            .eq("property_id", property.id)
            .eq("tenant_id", tenantId)
            .in("status", ["pending", "approved", "active"])
            .maybeSingle()

        if (existingError) throw existingError
        if (existingApplication) {
            return NextResponse.json({ error: "You already have an active application for this property" }, { status: 409 })
        }

        const appLetter = body.applicationLetter?.trim() || body.notes?.trim() || null
        const appLetterUrl = body.applicationLetterUrl?.trim() || null

        const { data: application, error: applicationError } = await supabaseAdmin
            .from("rentals")
            .insert({
                property_id: property.id,
                tenant_id: tenantId,
                landlord_id: property.landlord_id,
                rent_amount: property.price,
                employment: body.employment?.trim() || null,
                income: body.income?.trim() || null,
                notes: body.notes?.trim() || appLetter,
                application_letter: appLetter,
                application_letter_url: appLetterUrl,
                rent_start_date: body.rentStartDate || null,
                status: "pending",
            })
            .select("id")
            .single()

        if (applicationError) throw applicationError

        const { data: tenantProfile } = await supabaseAdmin
            .from("profiles")
            .select("name, fullname, full_name")
            .eq("id", tenantId)
            .maybeSingle()

        const profile = tenantProfile as TenantProfile | null
        const applicantName = profile?.fullname || profile?.full_name || profile?.name || "A tenant"
        const { error: notificationError } = await supabaseAdmin
            .from("notifications")
            .insert({
                user_id: property.landlord_id,
                type: "rental_application",
                title: "New Rental Application & Letter",
                message: `${applicantName} submitted a rental application and letter for ${property.title}.`,
                link: "/applications",
            })

        if (notificationError) {
            console.error("Rental application notification error:", notificationError)
        }

        return NextResponse.json({ success: true, applicationId: application.id })
    } catch (error: unknown) {
        console.error("Rental application API error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to submit application" },
            { status: 500 }
        )
    }
}
