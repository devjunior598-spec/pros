import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: Request) {
    const { response } = await requireAdmin()
    if (response) return response

    try {
        const body = await request.json().catch(() => ({}))
        const settlementId = typeof body.settlementId === "string" ? body.settlementId : ""
        const action = body.action === "approve" || body.action === "reject" ? body.action : null
        const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : null
        if (!settlementId || !action) return NextResponse.json({ error: "Settlement and action are required" }, { status: 400 })

        const { data, error } = await supabaseAdmin.rpc("approve_landlord_settlement", {
            p_settlement_id: settlementId,
            p_action: action,
            p_reason: reason,
        })
        if (error) throw error
        return NextResponse.json({ result: data, message: action === "approve" ? "Funds released to landlord" : "Settlement placed on hold" })
    } catch (error) {
        console.error("Settlement approval error:", error)
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to process settlement" }, { status: 500 })
    }
}
