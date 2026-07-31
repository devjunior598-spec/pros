import { NextResponse } from "next/server"
import { getCurrentUserWithRole } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
    const currentUser = await getCurrentUserWithRole()
    if (!currentUser) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const { data, error } = await supabaseAdmin.from("wallets")
        .select("auto_refill_enabled, auto_refill_threshold, auto_refill_amount, payment_card_last4, payment_card_brand, paystack_authorization_code")
        .eq("tenant_id", currentUser.user.id).maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({
        settings: data ? { ...data, hasPaymentMethod: Boolean(data.paystack_authorization_code), paystack_authorization_code: undefined } : null
    })
}

export async function POST(request: Request) {
    const currentUser = await getCurrentUserWithRole()
    if (!currentUser) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    if (currentUser.role !== "tenant") return NextResponse.json({ error: "Auto-Refill is available to tenants" }, { status: 403 })

    const { enabled, threshold, amount } = await request.json()
    const thresholdValue = Number(threshold)
    const amountValue = Number(amount)
    if (!Number.isFinite(thresholdValue) || thresholdValue < 0 || !Number.isFinite(amountValue) || amountValue < 1000) {
        return NextResponse.json({ error: "Use a valid threshold and a refill amount of at least ₦1,000" }, { status: 400 })
    }

    const { data: wallet } = await supabaseAdmin.from("wallets")
        .select("paystack_authorization_code").eq("tenant_id", currentUser.user.id).maybeSingle()
    if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
    if (enabled && !wallet.paystack_authorization_code) {
        return NextResponse.json({ error: "Fund your wallet once with a card before enabling Auto-Refill" }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from("wallets").update({
        auto_refill_enabled: Boolean(enabled), auto_refill_threshold: thresholdValue, auto_refill_amount: amountValue
    }).eq("tenant_id", currentUser.user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
