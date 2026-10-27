import { NextResponse } from "next/server"
import { getCurrentUserWithRole } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { createNotification } from "@/lib/notifications"

const landlordStatuses = new Set(["pending", "approved", "rejected"])

type RentalApplication = {
  id: string
  tenant_id: string
  landlord_id: string
  property_id: string
  rent_amount: number | null
  rent_start_date: string | null
  status: string
  property?: { title?: string | null } | null
}

export async function PATCH(request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    const current = await getCurrentUserWithRole()
    if (!current) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const { applicationId } = await params
    const body = await request.json().catch(() => ({})) as { status?: string; rejectionReason?: string }
    const nextStatus = typeof body.status === "string" ? body.status : ""

    if (!landlordStatuses.has(nextStatus)) {
      return NextResponse.json({ error: "Invalid application status" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("rentals")
      .select("id, tenant_id, landlord_id, property_id, rent_amount, rent_start_date, status, property:properties!rentals_property_id_fkey(title)")
      .eq("id", applicationId)
      .maybeSingle()

    if (error) throw error
    const application = data as unknown as RentalApplication | null
    if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 })

    const isLandlord = current.role === "landlord" && application.landlord_id === current.user.id
    const isAdmin = current.role === "admin"
    if (!isLandlord && !isAdmin) {
      return NextResponse.json({ error: "Not authorized to update this application" }, { status: 403 })
    }

    const { error: updateError } = await supabaseAdmin
      .from("rentals")
      .update({ status: nextStatus })
      .eq("id", application.id)
      .eq("landlord_id", application.landlord_id)

    if (updateError) throw updateError

    const propertyTitle = application.property?.title || "the property"

    if (nextStatus === "approved") {
      const today = new Date().toISOString().split("T")[0]
      const dueDate = application.rent_start_date || today

      await supabaseAdmin
        .from("properties")
        .update({ status: "rented", current_tenant_id: application.tenant_id })
        .eq("id", application.property_id)
        .eq("landlord_id", application.landlord_id)

      const { data: existingBill } = await supabaseAdmin
        .from("bills")
        .select("id")
        .eq("rental_id", application.id)
        .eq("type", "rent")
        .maybeSingle()

      if (!existingBill) {
        await supabaseAdmin.from("bills").insert({
          rental_id: application.id,
          type: "rent",
          amount: Number(application.rent_amount || 0),
          due_date: dueDate,
          status: "unpaid",
        })
      }

      await createNotification({
        userId: application.tenant_id,
        type: "rental_approval",
        title: "Application Approved!",
        message: `Your rental application for ${propertyTitle} was approved by the landlord.`,
        link: "/my-property",
      })
    }

    if (nextStatus === "rejected") {
      const reason = typeof body.rejectionReason === "string" ? body.rejectionReason.trim() : ""
      await createNotification({
        userId: application.tenant_id,
        type: "rental_rejection",
        title: "Application Update",
        message: `Your application for ${propertyTitle} was not accepted at this time.${reason ? ` Reason: ${reason}` : ""}`,
        link: "/applications",
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Application status update error:", error)
    return NextResponse.json({ error: "Could not update application" }, { status: 500 })
  }
}
