import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserWithRole } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { createNotification } from "@/lib/notifications"

const providerRoles = new Set(["provider", "service_provider"])
const providerStatuses = new Set(["Technician On The Way", "In Progress", "Completed"])

type MaintenanceTicket = {
    id: string
    ticket_number?: string | null
    title?: string | null
    tenant_id: string
    landlord_id: string
    assigned_provider_id?: string | null
    property_id?: string | null
}

function canViewTicket(userId: string, role: string, ticket: MaintenanceTicket) {
    return role === "admin" || ticket.landlord_id === userId || ticket.tenant_id === userId || ticket.assigned_provider_id === userId
}

function canPatchTicket(userId: string, role: string, ticket: MaintenanceTicket, action: string, status?: string) {
    if (role === "admin") return true
    if (action === "assign") return role === "landlord" && ticket.landlord_id === userId
    if (action === "update_status" && providerStatuses.has(status || "")) {
        return ticket.assigned_provider_id === userId || (role === "landlord" && ticket.landlord_id === userId)
    }
    return false
}

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ ticketId: string }> }
) {
    try {
        void req
        const { ticketId } = await context.params
        const currentUser = await getCurrentUserWithRole()

        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: ticket, error } = await supabaseAdmin
            .from("maintenance_tickets")
            .select(`
                *,
                tenant:profiles!tenant_id(id, name, email, phone),
                landlord:profiles!landlord_id(id, name, email, phone),
                property:properties!property_id(id, title, address),
                assigned_provider:profiles!assigned_provider_id(id, name, phone)
            `)
            .eq("id", ticketId)
            .single()

        if (error || !ticket) {
            return NextResponse.json({ error: "Maintenance ticket not found" }, { status: 404 })
        }

        if (!canViewTicket(currentUser.user.id, currentUser.role, ticket as MaintenanceTicket)) {
            return NextResponse.json({ error: "Not authorized to view this ticket" }, { status: 403 })
        }

        return NextResponse.json({ ticket })
    } catch (err) {
        console.error("Maintenance ticket fetch error:", err)
        return NextResponse.json({ error: "Error fetching ticket" }, { status: 500 })
    }
}

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ ticketId: string }> }
) {
    try {
        const { ticketId } = await context.params
        const currentUser = await getCurrentUserWithRole()

        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json().catch(() => ({}))
        const { action, providerId, status, completionNotes, completionImages, tenantSignatureUrl, locationData } = body

        const { data: ticket } = await supabaseAdmin.from("maintenance_tickets").select("*").eq("id", ticketId).single()
        if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 })

        const typedTicket = ticket as MaintenanceTicket
        if (!canPatchTicket(currentUser.user.id, currentUser.role, typedTicket, action, status)) {
            return NextResponse.json({ error: "Not authorized to update this ticket" }, { status: 403 })
        }

        const updateData: any = { updated_at: new Date().toISOString() }

        if (action === "assign" && providerId) {
            const { data: providerProfile } = await supabaseAdmin
                .from("profiles")
                .select("id, role")
                .eq("id", providerId)
                .maybeSingle()

            if (!providerProfile || !providerRoles.has(providerProfile.role)) {
                return NextResponse.json({ error: "Selected provider is not valid" }, { status: 400 })
            }

            updateData.assigned_provider_id = providerId
            updateData.status = "Assigned"

            await supabaseAdmin.from("provider_jobs").insert({
                ticket_id: ticketId,
                provider_id: providerId,
                landlord_id: typedTicket.landlord_id,
                tenant_id: typedTicket.tenant_id,
                property_id: typedTicket.property_id,
                status: "Assigned"
            })

            await createNotification({
                userId: providerId,
                type: "job_assigned",
                title: "New Job Assignment",
                message: `You have been assigned to maintenance ticket ${typedTicket.ticket_number}: "${typedTicket.title}".`,
                link: "/service-provider/dashboard"
            })
        } else if (action === "update_status" && providerStatuses.has(status)) {
            updateData.status = status
            if (locationData) {
                updateData.technician_location = locationData
            }

            if (status === "Completed") {
                updateData.completion_notes = typeof completionNotes === "string" ? completionNotes.slice(0, 3000) : ""
                updateData.completion_proof_images = Array.isArray(completionImages) ? completionImages.slice(0, 10) : []
                updateData.tenant_signature_url = typeof tenantSignatureUrl === "string" ? tenantSignatureUrl : null
                updateData.tenant_confirmed_at = new Date().toISOString()
            }

            await supabaseAdmin.from("provider_jobs").update({
                status: status === "Technician On The Way" ? "Travelling" : status === "In Progress" ? "Working" : status,
                updated_at: new Date().toISOString()
            }).eq("ticket_id", ticketId)

            await createNotification({
                userId: typedTicket.tenant_id,
                type: "ticket_status_update",
                title: `Maintenance Update: ${status}`,
                message: `Ticket ${typedTicket.ticket_number} status changed to ${status}.`,
                link: `/dashboard/tenant/maintenance`
            })
        } else {
            return NextResponse.json({ error: "Invalid ticket action" }, { status: 400 })
        }

        const { data: updatedTicket, error } = await supabaseAdmin
            .from("maintenance_tickets")
            .update(updateData)
            .eq("id", ticketId)
            .select()
            .single()

        if (error) return NextResponse.json({ error: "Error updating ticket" }, { status: 500 })

        return NextResponse.json({ ticket: updatedTicket, message: "Ticket updated successfully" })
    } catch (err) {
        console.error("Maintenance ticket update error:", err)
        return NextResponse.json({ error: "Error updating ticket" }, { status: 500 })
    }
}
