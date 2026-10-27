import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getCurrentUserWithRole } from "@/lib/supabase-server"
import { createNotification } from "@/lib/notifications"

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

function isMissingApplicationLetterColumn(error: unknown) {
    if (!error || typeof error !== "object") return false
    const message = "message" in error ? String(error.message) : ""
    const details = "details" in error ? String(error.details) : ""
    return `${message} ${details}`.includes("application_letter")
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
            .eq("country", "United States")
            .eq("publication_status", "published")
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

        const { data: tenantProfile } = await supabaseAdmin
            .from("profiles")
            .select("name, fullname, full_name, email, phone")
            .eq("id", tenantId)
            .maybeSingle()

        const profile = tenantProfile as TenantProfile & { email?: string; phone?: string } | null
        const applicantName = profile?.fullname || profile?.full_name || profile?.name || currentUser.user.email || "Prospective Tenant"

        let appLetter = body.applicationLetter?.trim() || body.notes?.trim() || null
        if (!appLetter) {
            const empStr = body.employment?.trim() || "Employed Professional"
            const incStr = body.income?.trim() ? `$${body.income.trim()}` : "Specified in profile"
            const moveInStr = body.rentStartDate ? new Date(body.rentStartDate).toLocaleDateString() : "Immediate"

            appLetter = `Dear Property Owner / Landlord,\n\nI am writing to formally submit my rental application for ${property.title}.\n\nAbout Me:\nMy name is ${applicantName}. I am interested in renting your property located at ${property.title}.\n\nRental Application Overview:\n- Applicant: ${applicantName}\n- Employment: ${empStr}\n- Monthly Income: ${incStr}\n- Preferred Move-in Date: ${moveInStr}\n\nI maintain a responsible lifestyle and ensure timely rent payments. Please review my attached application details and let me know if you require further information.\n\nSincerely,\n${applicantName}\nEmail: ${profile?.email || currentUser.user.email || ""}`
        }

        const appLetterUrl = body.applicationLetterUrl?.trim() || null

        const rentalPayload = {
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
        }

        let applicationResult = await supabaseAdmin
            .from("rentals")
            .insert(rentalPayload)
            .select("id")
            .single()

        if (applicationResult.error && isMissingApplicationLetterColumn(applicationResult.error)) {
            console.error("Application letter columns are missing; saving letter in notes only:", applicationResult.error)
            const fallbackPayload = {
                property_id: rentalPayload.property_id,
                tenant_id: rentalPayload.tenant_id,
                landlord_id: rentalPayload.landlord_id,
                rent_amount: rentalPayload.rent_amount,
                employment: rentalPayload.employment,
                income: rentalPayload.income,
                notes: rentalPayload.notes,
                rent_start_date: rentalPayload.rent_start_date,
                status: rentalPayload.status,
            }
            applicationResult = await supabaseAdmin
                .from("rentals")
                .insert(fallbackPayload)
                .select("id")
                .single()
        }

        if (applicationResult.error) throw applicationResult.error

        const { data: inspection } = await supabaseAdmin
            .from("inspection_bookings")
            .select("inspection_date, inspection_time, inspection_type, status")
            .eq("property_id", property.id)
            .eq("tenant_id", tenantId)
            .order("inspection_date", { ascending: false })
            .order("inspection_time", { ascending: false })
            .limit(1)
            .maybeSingle()

        const inspectionText = inspection
            ? ` Inspection: ${inspection.inspection_type} on ${inspection.inspection_date} at ${String(inspection.inspection_time).substring(0, 5)} (${inspection.status}).`
            : ""
        const attachmentText = appLetterUrl ? " An attached letter file is included." : ""

        try {
            await createNotification({
                userId: property.landlord_id,
                type: "rental_application",
                title: "New Rental Application, Letter & Inspection",
                message: `${applicantName} submitted a rental application and letter for ${property.title}.${inspectionText}${attachmentText}`,
                link: "/applications",
            })
        } catch (notificationError) {
            console.error("Rental application notification error:", notificationError)
        }

        return NextResponse.json({ success: true, applicationId: applicationResult.data.id })
    } catch (error: unknown) {
        console.error("Rental application API error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to submit application" },
            { status: 500 }
        )
    }
}
