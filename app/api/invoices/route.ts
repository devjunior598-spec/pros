import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { createNotification } from "@/lib/notifications"
import { sendEmail, buildEmailTemplate } from "@/lib/email"
import { generateInvoicePDF } from "@/lib/invoice-pdf-generator"

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authErr } = await supabase.auth.getUser()

        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const role = searchParams.get("role") || "tenant"

        let query = supabaseAdmin
            .from("invoices")
            .select(`
                *,
                tenant:profiles!tenant_id(name, email),
                landlord:profiles!landlord_id(name, email),
                property:properties!property_id(title, address)
            `)
            .order("created_at", { ascending: false })

        if (role === "landlord") {
            query = query.eq("landlord_id", user.id)
        } else if (role === "tenant") {
            query = query.eq("tenant_id", user.id)
        }

        const { data: invoices, error } = await query
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ invoices })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to fetch invoices" }, { status: 500 })
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
        const { tenantId, propertyId, unitId, paymentType, description, amount, dueDate, notes } = body

        if (!tenantId || !propertyId || !description || !amount || !dueDate) {
            return NextResponse.json({ error: "Missing required invoice fields" }, { status: 400 })
        }

        const randomNum = Math.floor(100000 + Math.random() * 900000)
        const invoiceNumber = `PRMS-INV-${new Date().getFullYear()}-${randomNum}`

        // Generate PDF
        const { data: landlordProfile } = await supabaseAdmin.from("profiles").select("name").eq("id", user.id).single()
        const { data: tenantProfile } = await supabaseAdmin.from("profiles").select("name, email").eq("id", tenantId).single()
        const { data: property } = await supabaseAdmin.from("properties").select("title, address").eq("id", propertyId).single()

        const pdfDoc = generateInvoicePDF({
            invoiceNumber,
            date: new Date().toLocaleDateString(),
            dueDate,
            tenantName: tenantProfile?.name || "Tenant",
            tenantEmail: tenantProfile?.email || "",
            propertyAddress: property?.address || property?.title || "",
            landlordName: landlordProfile?.name || "Landlord",
            items: [{ description, amount: Number(amount) }],
            totalAmount: Number(amount),
            status: "Sent",
            notes
        })

        const pdfBuffer = Buffer.from(pdfDoc.output("arraybuffer"))
        const pdfPath = `invoices/invoice_${invoiceNumber}.pdf`

        await supabaseAdmin.storage.from("payment-receipts").upload(pdfPath, pdfBuffer, {
            contentType: "application/pdf",
            upsert: true
        })

        const { data: invoice, error } = await supabaseAdmin
            .from("invoices")
            .insert({
                invoice_number: invoiceNumber,
                landlord_id: user.id,
                tenant_id: tenantId,
                property_id: propertyId,
                unit_id: unitId || null,
                payment_type: paymentType || "custom",
                description,
                amount: Number(amount),
                due_date: dueDate,
                notes: notes || "",
                pdf_path: pdfPath,
                status: "Sent"
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Also create a payment schedule for tenant to pay easily
        await supabaseAdmin.from("payment_schedules").insert({
            landlord_id: user.id,
            tenant_id: tenantId,
            property_id: propertyId,
            unit_id: unitId || null,
            payment_type: paymentType || "custom_invoice",
            description: `Invoice ${invoiceNumber}: ${description}`,
            amount: Number(amount),
            due_date: dueDate,
            status: "Due",
            paid_amount: 0,
            outstanding_amount: Number(amount)
        })

        // Notify tenant
        await createNotification({
            userId: tenantId,
            type: "invoice_received",
            title: `New Invoice Issued: ${invoiceNumber}`,
            message: `You have received an invoice for ${description} ($${Number(amount).toLocaleString()}). Due: ${dueDate}`,
            link: "/dashboard/tenant/payments"
        })

        if (tenantProfile?.email) {
            await sendEmail({
                to: tenantProfile.email,
                subject: `New Invoice Received: ${invoiceNumber}`,
                html: buildEmailTemplate({
                    title: "Invoice Issued",
                    recipientName: tenantProfile.name,
                    message: `An invoice for "${description}" in the amount of $${Number(amount).toLocaleString()} has been issued for ${property?.title}. Due date: ${dueDate}.`,
                    ctaText: "Pay Invoice",
                    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/tenant/payments`
                })
            })
        }

        return NextResponse.json({ invoice, message: "Invoice issued successfully" })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to create invoice" }, { status: 500 })
    }
}
