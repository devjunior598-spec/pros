import { NextResponse } from "next/server"
import { getCurrentUserWithRole } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { createNotification } from "@/lib/notifications"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"])
const documentTypes = new Set(["government_id", "proof_of_income", "employment_letter", "supporting_document"])

export async function POST(request: Request) {
  try {
    const current = await getCurrentUserWithRole()
    if (!current) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    if (current.role !== "tenant") return NextResponse.json({ error: "Only tenant accounts can submit applications" }, { status: 403 })
    const form = await request.formData()
    const propertyId = String(form.get("propertyId") || "")
    const unitId = String(form.get("unitId") || "") || null
    const intent = String(form.get("intent") || "submit")
    if (!propertyId) return NextResponse.json({ error: "Property is required" }, { status: 400 })

    const { data: property, error: propertyError } = await supabaseAdmin.from("properties").select("id,title,landlord_id,status,is_multi_unit").eq("id", propertyId).eq("country", "United States").eq("publication_status", "published").maybeSingle()
    if (propertyError) throw propertyError
    if (!property?.landlord_id || property.status !== "available") return NextResponse.json({ error: "This property is not accepting applications" }, { status: 400 })
    if (unitId) {
      const { data: unit } = await supabaseAdmin.from("property_units").select("id,property_id,availability,published").eq("id", unitId).maybeSingle()
      if (!unit || unit.property_id !== property.id || !unit.published || unit.availability !== "available") return NextResponse.json({ error: "This unit is not available" }, { status: 400 })
    }
    const required = ["occupation", "employmentStatus", "monthlyIncome", "preferredMoveInDate", "numberOfOccupants", "reasonForMoving", "guarantorName", "guarantorPhone", "guarantorAddress"]
    if (intent === "submit" && required.some((field) => !String(form.get(field) || "").trim())) return NextResponse.json({ error: "Please complete all required application fields" }, { status: 400 })
    const tenantId = current.user.id
    const payload = {
      property_id: property.id, unit_id: unitId, landlord_id: property.landlord_id, tenant_id: tenantId,
      application_letter: String(form.get("applicationLetter") || "").trim() || null,
      occupation: String(form.get("occupation") || "").trim() || null, employer: String(form.get("employer") || "").trim() || null,
      employment_status: String(form.get("employmentStatus") || "").trim() || null, monthly_income: Number(form.get("monthlyIncome") || 0) || null,
      preferred_move_in_date: String(form.get("preferredMoveInDate") || "") || null, number_of_occupants: Number(form.get("numberOfOccupants") || 0) || null,
      reason_for_moving: String(form.get("reasonForMoving") || "").trim() || null, guarantor_name: String(form.get("guarantorName") || "").trim() || null,
      guarantor_phone: String(form.get("guarantorPhone") || "").trim() || null, guarantor_address: String(form.get("guarantorAddress") || "").trim() || null,
      references: String(form.get("references") || "").trim() || null, status: intent === "draft" ? "draft" : "submitted",
    }
    const { data: application, error } = await supabaseAdmin.from("applications").insert(payload).select("id").single()
    if (error?.code === "23505") return NextResponse.json({ error: "You already have an active application for this property or unit" }, { status: 409 })
    if (error) throw error
    for (const entry of form.getAll("documents")) {
      if (!(entry instanceof File) || entry.size === 0) continue
      const type = entry.name.split("__")[0]
      if (!documentTypes.has(type) || !allowedTypes.has(entry.type) || entry.size > MAX_FILE_SIZE) throw new Error(`Invalid document: ${entry.name}`)
      const extension = entry.name.split(".").pop() || "bin"
      const path = `${tenantId}/${application.id}/${crypto.randomUUID()}.${extension}`
      const { error: uploadError } = await supabaseAdmin.storage.from("application-documents").upload(path, entry, { contentType: entry.type, upsert: false })
      if (uploadError) throw uploadError
      const { error: documentError } = await supabaseAdmin.from("application_documents").insert({ application_id: application.id, tenant_id: tenantId, document_type: type, file_name: entry.name.replace(`${type}__`, ""), file_path: path })
      if (documentError) throw documentError
    }
    if (intent !== "draft") await createNotification({ userId: property.landlord_id, type: "application_submitted", title: "New rental application", message: `A tenant submitted an application for ${property.title}.`, link: `/dashboard/landlord/applications/${application.id}` })
    return NextResponse.json({ applicationId: application.id, status: payload.status }, { status: 201 })
  } catch (error) {
    console.error("Application submission error", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not submit application" }, { status: 500 })
  }
}
