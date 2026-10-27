import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserWithRole } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { createNotification } from "@/lib/notifications"
import { sendEmail, buildEmailTemplate } from "@/lib/email"

const text = (value: unknown, max = 5000) => typeof value === "string" ? value.trim().slice(0, max) : ""
const num = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback

type RentalConnection = {
    id: string
    tenant_id: string
    landlord_id: string
    property_id: string
    rent_amount?: number | null
    status: string
}

export async function GET(req: NextRequest) {
    try {
        const currentUser = await getCurrentUserWithRole()
        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const role = searchParams.get("role") || currentUser.role
        const status = searchParams.get("status")

        let query = supabaseAdmin
            .from("lease_agreements")
            .select(`
                *,
                tenant:profiles!tenant_id(id, name, email, phone),
                landlord:profiles!landlord_id(id, name, email, phone),
                property:properties!property_id(id, title, address, city, state, images),
                signatures:lease_signatures(*)
            `)
            .order("created_at", { ascending: false })

        if (role === "tenant") {
            query = query.eq("tenant_id", currentUser.user.id)
        } else if (role === "admin" && currentUser.role === "admin") {
            // Admin sees all leases.
        } else {
            if (currentUser.role !== "landlord" && currentUser.role !== "admin") {
                return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
            }
            query = query.eq("landlord_id", currentUser.user.id)
        }

        if (status && status !== "all") {
            query = query.eq("status", status)
        }

        const { data: leases, error } = await query

        if (error) {
            return NextResponse.json({ error: "Failed to fetch leases" }, { status: 500 })
        }

        return NextResponse.json({ leases })
    } catch (err) {
        console.error("Lease list error:", err)
        return NextResponse.json({ error: "Failed to fetch leases" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUserWithRole()
        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        if (currentUser.role !== "landlord") {
            return NextResponse.json({ error: "Only landlords can create leases" }, { status: 403 })
        }

        const body = await req.json().catch(() => ({}))
        const applicationId = text(body.applicationId, 100) || null
        if (!applicationId) {
            return NextResponse.json({ error: "Select an approved application before creating a lease" }, { status: 400 })
        }
        const propertyId = text(body.propertyId, 100)
        const unitId = text(body.unitId, 100) || null
        const tenantId = text(body.tenantId, 100)
        const title = text(body.title, 200)
        const requestedRentAmount = num(body.rentAmount)
        const startDate = text(body.startDate, 30)
        const endDate = text(body.endDate, 30)

        if (!title || requestedRentAmount < 0 || !startDate || !endDate) {
            return NextResponse.json({ error: "Missing required lease fields" }, { status: 400 })
        }

        let rentalQuery = supabaseAdmin
            .from("rentals")
            .select("id, tenant_id, landlord_id, property_id, rent_amount, status")
            .eq("landlord_id", currentUser.user.id)
            .eq("id", applicationId)
            .in("status", ["approved", "active"])

        const { data: rental, error: rentalError } = await rentalQuery.limit(1).maybeSingle()
        if (rentalError) throw rentalError
        const connection = rental as RentalConnection | null
        if (!connection) {
            return NextResponse.json({ error: "Only approved applications can become leases" }, { status: 403 })
        }

        if ((propertyId && propertyId !== connection.property_id) || (tenantId && tenantId !== connection.tenant_id)) {
            return NextResponse.json({ error: "Lease details must match the approved application" }, { status: 400 })
        }

        const { data: property, error: propertyError } = await supabaseAdmin
            .from("properties")
            .select("id, landlord_id, title")
            .eq("id", connection.property_id)
            .eq("landlord_id", currentUser.user.id)
            .maybeSingle()
        if (propertyError) throw propertyError
        if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 })

        if (unitId) {
            const { data: unit, error: unitError } = await supabaseAdmin
                .from("property_units")
                .select("id")
                .eq("id", unitId)
                .eq("property_id", connection.property_id)
                .eq("landlord_id", currentUser.user.id)
                .maybeSingle()
            if (unitError) throw unitError
            if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 })
        }

        const rentAmount = connection.rent_amount && connection.rent_amount > 0 ? connection.rent_amount : requestedRentAmount
        if (rentAmount <= 0) return NextResponse.json({ error: "The approved application has no valid rent amount" }, { status: 400 })

        const initialStatus = body.action === "send_tenant" ? "Sent" : "Draft"

        const { data: lease, error } = await supabaseAdmin
            .from("lease_agreements")
            .insert({
                landlord_id: currentUser.user.id,
                tenant_id: connection.tenant_id,
                property_id: connection.property_id,
                unit_id: unitId,
                application_id: connection.id,
                title,
                template_type: text(body.templateType, 50) || "residential",
                rent_amount: rentAmount,
                payment_frequency: text(body.paymentFrequency, 30) || "monthly",
                security_deposit: num(body.securityDeposit),
                service_charge: num(body.serviceCharge),
                other_charges: num(body.otherCharges),
                start_date: startDate,
                end_date: endDate,
                due_day: num(body.dueDay, 1),
                grace_period_days: num(body.gracePeriodDays, 5),
                late_fee_type: text(body.lateFeeType, 30) || "fixed",
                late_fee_amount: num(body.lateFeeAmount),
                renewal_terms: text(body.renewalTerms),
                notice_period_days: num(body.noticePeriodDays, 30),
                property_rules: text(body.propertyRules, 10000),
                maintenance_terms: text(body.maintenanceTerms, 10000),
                utility_terms: text(body.utilityTerms, 10000),
                guest_policy: text(body.guestPolicy, 5000),
                pet_policy: text(body.petPolicy, 5000),
                termination_terms: text(body.terminationTerms, 10000),
                custom_terms: text(body.customTerms, 20000),
                status: initialStatus
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: "Failed to create lease" }, { status: 500 })
        }

        await supabaseAdmin.from("audit_logs").insert({
            user_id: currentUser.user.id,
            role: "landlord",
            action: initialStatus === "Sent" ? "LEASE_CREATED_AND_SENT" : "LEASE_DRAFT_CREATED",
            entity_type: "lease_agreements",
            entity_id: lease.id,
            new_value: lease
        })

        if (initialStatus === "Sent") {
            const { data: tenantProfile } = await supabaseAdmin.from("profiles").select("name, email").eq("id", tenantId).single()
            if (tenantProfile) {
                await createNotification({
                    userId: tenantId,
                    type: "lease_sent",
                    title: "New Lease Agreement Received",
                    message: `You have received a new digital lease agreement: "${title}". Please review and sign.`,
                    link: `/dashboard/tenant/leases/${lease.id}`
                })

                await sendEmail({
                    to: tenantProfile.email,
                    subject: `Digital Lease Ready for Signature: ${title}`,
                    html: buildEmailTemplate({
                        title: "Digital Lease Ready for Review",
                        recipientName: tenantProfile.name,
                        message: `Your landlord has generated an official lease agreement for "${title}". Please log in to review the terms and provide your digital signature.`,
                        ctaText: "Review & Sign Lease",
                        ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/tenant/leases/${lease.id}`
                    })
                })
            }
        }

        return NextResponse.json({ lease, message: initialStatus === "Sent" ? "Lease sent to tenant" : "Lease saved as draft" })
    } catch (err) {
        console.error("Lease create error:", err)
        return NextResponse.json({ error: "Failed to create lease" }, { status: 500 })
    }
}
