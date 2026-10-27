import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { generateLeasePDF } from "@/lib/lease-pdf-generator"
import { createNotification } from "@/lib/notifications"
import { sendEmail, buildEmailTemplate } from "@/lib/email"

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ leaseId: string }> }
) {
    try {
        const { leaseId } = await context.params
        const supabase = await createClient()
        const { data: { user }, error: authErr } = await supabase.auth.getUser()

        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: lease, error } = await supabaseAdmin
            .from("lease_agreements")
            .select(`
                *,
                tenant:profiles!tenant_id(id, name, email, phone),
                landlord:profiles!landlord_id(id, name, email, phone),
                property:properties!property_id(id, title, address, city, state, images),
                signatures:lease_signatures(*),
                payment_schedules(*)
            `)
            .eq("id", leaseId)
            .single()

        if (error || !lease) {
            return NextResponse.json({ error: "Lease contract not found" }, { status: 404 })
        }

        // Verify participant ownership or admin
        if (lease.landlord_id !== user.id && lease.tenant_id !== user.id) {
            const { data: userProfile } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single()
            if (userProfile?.role !== "admin") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }
        }

        // If viewed by tenant for the first time, update status to Viewed if Sent
        if (lease.tenant_id === user.id && lease.status === "Sent") {
            await supabaseAdmin
                .from("lease_agreements")
                .update({ status: "Viewed" })
                .eq("id", leaseId)
            lease.status = "Viewed"
        }

        return NextResponse.json({ lease })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Error fetching lease" }, { status: 500 })
    }
}

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ leaseId: string }> }
) {
    try {
        const { leaseId } = await context.params
        const supabase = await createClient()
        const { data: { user }, error: authErr } = await supabase.auth.getUser()

        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { action } = body

        // Fetch current lease
        const { data: lease, error: fetchErr } = await supabaseAdmin
            .from("lease_agreements")
            .select(`
                *,
                tenant:profiles!tenant_id(id, name, email, phone),
                landlord:profiles!landlord_id(id, name, email, phone),
                property:properties!property_id(id, title, address),
                signatures:lease_signatures(*)
            `)
            .eq("id", leaseId)
            .single()

        if (fetchErr || !lease) {
            return NextResponse.json({ error: "Lease not found" }, { status: 404 })
        }

        // Action: Sign Lease
        if (action === "sign") {
            const { signerName, signatureType, signatureData, ipAddress, userAgent } = body

            if (!signatureData || !signatureType || !signerName) {
                return NextResponse.json({ error: "Signature data is required" }, { status: 400 })
            }

            const role = user.id === lease.tenant_id ? "tenant" : user.id === lease.landlord_id ? "landlord" : null
            if (!role) {
                return NextResponse.json({ error: "Only lease participants can sign" }, { status: 403 })
            }

            // Check if already signed by this role
            const existingSig = lease.signatures?.find((s: any) => s.role === role)
            if (existingSig) {
                return NextResponse.json({ error: `Lease already signed by ${role}` }, { status: 400 })
            }

            // Insert Signature
            const { error: sigErr } = await supabaseAdmin.from("lease_signatures").insert({
                lease_id: leaseId,
                user_id: user.id,
                role,
                signer_name: signerName,
                signature_type: signatureType,
                signature_data: signatureData,
                ip_address: ipAddress || req.headers.get("x-forwarded-for") || "127.0.0.1",
                user_agent: userAgent || req.headers.get("user-agent") || "Browser",
            })

            if (sigErr) {
                return NextResponse.json({ error: sigErr.message }, { status: 500 })
            }

            // Determine updated status
            const isTenantSigning = role === "tenant"
            const isLandlordSigning = role === "landlord"
            const hasOtherSig = lease.signatures?.some((s: any) => s.role === (isTenantSigning ? "landlord" : "tenant"))

            let nextStatus = lease.status
            const nowIso = new Date().toISOString()
            const updatePayload: any = {}

            if (isTenantSigning) {
                updatePayload.tenant_signed_at = nowIso
                nextStatus = hasOtherSig ? "Fully Signed" : "Tenant Signed"
            } else if (isLandlordSigning) {
                updatePayload.landlord_signed_at = nowIso
                nextStatus = hasOtherSig ? "Fully Signed" : "Landlord Signed"
            }

            if (hasOtherSig) {
                updatePayload.fully_signed_at = nowIso
                updatePayload.status = "Fully Signed"
            } else {
                updatePayload.status = nextStatus
            }

            // Update lease status
            await supabaseAdmin.from("lease_agreements").update(updatePayload).eq("id", leaseId)

            // If Fully Signed, perform completion routine
            if (hasOtherSig) {
                // Fetch all signatures
                const { data: updatedSigs } = await supabaseAdmin.from("lease_signatures").select("*").eq("lease_id", leaseId)

                // Generate PDF
                const pdfDoc = generateLeasePDF({
                    title: lease.title,
                    templateType: lease.template_type,
                    landlordName: lease.landlord?.name || "Landlord",
                    landlordEmail: lease.landlord?.email || "",
                    landlordPhone: lease.landlord?.phone || "",
                    tenantName: lease.tenant?.name || "Tenant",
                    tenantEmail: lease.tenant?.email || "",
                    tenantPhone: lease.tenant?.phone || "",
                    propertyName: lease.property?.title || "Property",
                    propertyAddress: lease.property?.address || "",
                    rentAmount: lease.rent_amount,
                    paymentFrequency: lease.payment_frequency,
                    securityDeposit: lease.security_deposit,
                    startDate: lease.start_date,
                    endDate: lease.end_date,
                    houseRules: lease.property_rules ? [lease.property_rules] : [],
                    termsAndConditions: lease.termination_terms || "Standard PRMS lease agreement terms apply.",
                    signatures: (updatedSigs || []).map((s: any) => ({
                        role: s.role,
                        signerName: s.signer_name,
                        signatureType: s.signature_type,
                        signatureValue: s.signature_data,
                        ipAddress: s.ip_address || "127.0.0.1",
                        userAgent: s.user_agent || "Browser",
                        signedAt: s.signed_at,
                    })),
                    status: "Fully Signed"
                })

                // Upload PDF to Supabase Storage
                const pdfBuffer = Buffer.from(pdfDoc.output("arraybuffer"))
                const pdfPath = `signed_leases/lease_${leaseId}.pdf`

                await supabaseAdmin.storage.from("lease-documents").upload(pdfPath, pdfBuffer, {
                    contentType: "application/pdf",
                    upsert: true
                })

                await supabaseAdmin.from("lease_agreements").update({
                    pdf_path: pdfPath,
                    status: "Active"
                }).eq("id", leaseId)

                // Auto-create initial Payment Schedule (Security Deposit & Rent)
                if (lease.security_deposit > 0) {
                    await supabaseAdmin.from("payment_schedules").insert({
                        lease_id: leaseId,
                        landlord_id: lease.landlord_id,
                        tenant_id: lease.tenant_id,
                        property_id: lease.property_id,
                        unit_id: lease.unit_id,
                        payment_type: "security_deposit",
                        description: `Security Deposit for ${lease.title}`,
                        amount: lease.security_deposit,
                        due_date: lease.start_date,
                        status: "Due",
                        paid_amount: 0,
                        outstanding_amount: lease.security_deposit,
                    })

                    await supabaseAdmin.from("security_deposits").insert({
                        lease_id: leaseId,
                        landlord_id: lease.landlord_id,
                        tenant_id: lease.tenant_id,
                        property_id: lease.property_id,
                        unit_id: lease.unit_id,
                        amount: lease.security_deposit,
                        status: "Due"
                    })
                }

                // Initial Rent Payment Schedule
                await supabaseAdmin.from("payment_schedules").insert({
                    lease_id: leaseId,
                    landlord_id: lease.landlord_id,
                    tenant_id: lease.tenant_id,
                    property_id: lease.property_id,
                    unit_id: lease.unit_id,
                    payment_type: "rent",
                    description: `First Rent Payment for ${lease.title}`,
                    amount: lease.rent_amount,
                    due_date: lease.start_date,
                    status: "Due",
                    paid_amount: 0,
                    outstanding_amount: lease.rent_amount,
                })

                // Notify both parties
                const notifyUser = async (targetId: string, roleName: string, targetEmail?: string, targetName?: string) => {
                    await createNotification({
                        userId: targetId,
                        type: "lease_fully_signed",
                        title: "Lease Fully Executed & Active",
                        message: `The lease contract "${lease.title}" has been signed by both parties and is now officially active!`,
                        link: `/dashboard/${roleName}/leases/${leaseId}`
                    })
                    if (targetEmail && targetName) {
                        await sendEmail({
                            to: targetEmail,
                            subject: `Lease Fully Executed: ${lease.title}`,
                            html: buildEmailTemplate({
                                title: "Lease Agreement Fully Signed",
                                recipientName: targetName,
                                message: `Congratulations! The digital lease contract for "${lease.title}" has been fully executed by both landlord and tenant. The tenancy is now active and payment schedules have been posted to your portal.`,
                                ctaText: "View Active Lease",
                                ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/${roleName}/leases/${leaseId}`
                            })
                        })
                    }
                }

                await notifyUser(lease.landlord_id, "landlord", lease.landlord?.email, lease.landlord?.name)
                await notifyUser(lease.tenant_id, "tenant", lease.tenant?.email, lease.tenant?.name)
            } else {
                // Notify counterpart of single signature
                const otherPartyId = isTenantSigning ? lease.landlord_id : lease.tenant_id
                const otherRole = isTenantSigning ? "landlord" : "tenant"
                const signerRoleLabel = isTenantSigning ? "Tenant" : "Landlord"

                await createNotification({
                    userId: otherPartyId,
                    type: "lease_signed",
                    title: `${signerRoleLabel} Signed Lease`,
                    message: `${signerName} has provided their digital signature for "${lease.title}". Your countersignature is required.`,
                    link: `/dashboard/${otherRole}/leases/${leaseId}`
                })
            }

            return NextResponse.json({ message: "Signature saved successfully", status: updatePayload.status || nextStatus })
        }

        // Action: Cancel Draft / Send to Tenant / Terminate Lease / Renew Lease
        if (action === "send") {
            await supabaseAdmin.from("lease_agreements").update({ status: "Sent" }).eq("id", leaseId)
            return NextResponse.json({ message: "Lease sent to tenant" })
        }

        if (action === "cancel") {
            await supabaseAdmin.from("lease_agreements").update({ status: "Cancelled" }).eq("id", leaseId)
            return NextResponse.json({ message: "Lease cancelled" })
        }

        if (action === "terminate") {
            await supabaseAdmin.from("lease_agreements").update({ status: "Terminated", terminated_at: new Date().toISOString() }).eq("id", leaseId)
            return NextResponse.json({ message: "Lease terminated" })
        }

        if (action === "renew") {
            // Create a renewal request
            await supabaseAdmin.from("lease_agreements").update({ status: "Renewal Pending" }).eq("id", leaseId)
            return NextResponse.json({ message: "Lease renewal request submitted" })
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Error updating lease" }, { status: 500 })
    }
}
