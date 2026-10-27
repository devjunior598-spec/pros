import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authErr } = await supabase.auth.getUser()

        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Fetch payments, webhooks, and receipts to compare
        const { data: payments } = await supabaseAdmin.from("payments").select("*").order("created_at", { ascending: false }).limit(100)
        const { data: webhooks } = await supabaseAdmin.from("payment_webhook_events").select("*").order("received_at", { ascending: false }).limit(100)
        const { data: receipts } = await supabaseAdmin.from("receipts").select("*").order("created_at", { ascending: false }).limit(100)

        // Flag anomalies (e.g., successful webhook with missing receipt or pending payment)
        const anomalies: any[] = []

        payments?.forEach(p => {
            if (p.payment_status === "Successful") {
                const hasReceipt = receipts?.some(r => r.payment_id === p.id)
                if (!hasReceipt) {
                    anomalies.push({
                        type: "MISSING_RECEIPT",
                        severity: "HIGH",
                        description: `Payment ${p.transaction_reference} is verified successful but lacks a generated receipt.`,
                        payment: p
                    })
                }
            }
        })

        webhooks?.forEach(w => {
            if (w.event_type === "charge.success" && !w.processed) {
                anomalies.push({
                    type: "UNPROCESSED_WEBHOOK",
                    severity: "MEDIUM",
                    description: `Webhook event ${w.event_reference} is unprocessed.`,
                    webhook: w
                })
            }
        })

        return NextResponse.json({
            reconciliationSummary: {
                totalPayments: payments?.length || 0,
                totalWebhooks: webhooks?.length || 0,
                totalReceipts: receipts?.length || 0,
                flaggedAnomaliesCount: anomalies.length
            },
            anomalies,
            recentPayments: payments || []
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Reconciliation error" }, { status: 500 })
    }
}
