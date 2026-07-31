import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(request: Request) {
    const secret = process.env.CRON_SECRET
    if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!process.env.PAYSTACK_SECRET_KEY) return NextResponse.json({ error: "Paystack is not configured" }, { status: 503 })

    const { data: wallets, error } = await supabaseAdmin.from("wallets")
        .select("id, tenant_id, balance, auto_refill_threshold, auto_refill_amount, paystack_authorization_code, auto_refill_last_attempt_at")
        .eq("auto_refill_enabled", true).not("paystack_authorization_code", "is", null)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    let charged = 0
    let skipped = 0
    for (const wallet of wallets || []) {
        if (Number(wallet.balance) > Number(wallet.auto_refill_threshold)) { skipped++; continue }
        const lastAttempt = wallet.auto_refill_last_attempt_at ? new Date(wallet.auto_refill_last_attempt_at).getTime() : 0
        if (Date.now() - lastAttempt < 60 * 60 * 1000) { skipped++; continue }

        const { data: profile } = await supabaseAdmin.from("profiles").select("email").eq("id", wallet.tenant_id).maybeSingle()
        if (!profile?.email) { skipped++; continue }
        await supabaseAdmin.from("wallets").update({ auto_refill_last_attempt_at: new Date().toISOString() }).eq("id", wallet.id)

        const response = await fetch("https://api.paystack.co/transaction/charge_authorization", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                email: profile.email,
                amount: Math.round(Number(wallet.auto_refill_amount) * 100),
                authorization_code: wallet.paystack_authorization_code,
                reference: `auto-refill-${wallet.tenant_id.slice(0, 8)}-${Date.now()}`,
                metadata: { type: "fund_wallet", tenant_id: wallet.tenant_id, auto_refill: true }
            })
        })
        if (response.ok) charged++; else skipped++
    }
    return NextResponse.json({ success: true, charged, skipped })
}
