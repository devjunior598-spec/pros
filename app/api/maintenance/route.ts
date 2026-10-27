import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { createNotification } from "@/lib/notifications"
import { sendEmail, buildEmailTemplate } from "@/lib/email"

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authErr } = await supabase.auth.getUser()

        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const role = searchParams.get("role") || "tenant"
        const status = searchParams.get("status")

        let query = supabaseAdmin
            .from("maintenance_tickets")
            .select(`
                *,
                tenant:profiles!tenant_id(id, name, email, phone),
                landlord:profiles!landlord_id(id, name, email, phone),
                property:properties!property_id(id, title, address),
                assigned_provider:profiles!assigned_provider_id(id, name, phone)
            `)
            .order("created_at", { ascending: false })

        if (role === "tenant") {
            query = query.eq("tenant_id", user.id)
        } else if (role === "landlord") {
            query = query.eq("landlord_id", user.id)
        } else if (role === "provider") {
            query = query.eq("assigned_provider_id", user.id)
        }

        if (status && status !== "all") {
            query = query.eq("status", status)
        }

        const { data: tickets, error } = await query
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ tickets })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to fetch maintenance tickets" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authErr } = await supabase.auth.getUser()

        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const {
            propertyId,
            unitId,
            title,
            description,
            category,
            priority,
            isEmergency,
            images,
            videos,
            preferredVisitDate,
            preferredVisitTime,
            specialInstructions
        } = body

        if (!propertyId || !title || !description || !category) {
            return NextResponse.json({ error: "Missing required maintenance fields" }, { status: 400 })
        }

        // Fetch property to get landlord_id
        const { data: property } = await supabaseAdmin.from("properties").select("landlord_id, title").eq("id", propertyId).single()
        if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 })

        const randomNum = Math.floor(100000 + Math.random() * 900000)
        const ticketNumber = `PRMS-MNT-${randomNum}`

        const { data: ticket, error } = await supabaseAdmin
            .from("maintenance_tickets")
            .insert({
                ticket_number: ticketNumber,
                tenant_id: user.id,
                landlord_id: property.landlord_id,
                property_id: propertyId,
                unit_id: unitId || null,
                title,
                description,
                category,
                priority: priority || "Medium",
                is_emergency: Boolean(isEmergency),
                images: images || [],
                videos: videos || [],
                preferred_visit_date: preferredVisitDate || null,
                preferred_visit_time: preferredVisitTime || null,
                special_instructions: specialInstructions || "",
                status: "Submitted"
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Notify landlord & Operations
        await createNotification({
            userId: property.landlord_id,
            type: "maintenance_ticket",
            title: isEmergency ? `EMERGENCY MAINTENANCE: ${ticketNumber}` : `New Maintenance Request: ${ticketNumber}`,
            message: `Tenant reported ${category} issue: "${title}" at ${property.title}.`,
            link: "/dashboard/landlord/maintenance"
        })

        const { data: landlordProfile } = await supabaseAdmin.from("profiles").select("email, name").eq("id", property.landlord_id).single()
        if (landlordProfile?.email) {
            await sendEmail({
                to: landlordProfile.email,
                subject: isEmergency ? `🚨 URGENT EMERGENCY: Ticket ${ticketNumber}` : `New Maintenance Request: ${ticketNumber}`,
                html: buildEmailTemplate({
                    title: isEmergency ? "Emergency Maintenance Alert" : "Maintenance Ticket Submitted",
                    recipientName: landlordProfile.name,
                    message: `A new maintenance ticket (${ticketNumber}) has been reported for ${property.title}: "${title}". Please review and assign a technician.`,
                    ctaText: "Manage Maintenance",
                    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/landlord/maintenance`
                })
            })
        }

        return NextResponse.json({ ticket, message: "Maintenance ticket created successfully" })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to submit maintenance request" }, { status: 500 })
    }
}
