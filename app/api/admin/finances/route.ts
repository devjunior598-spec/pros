import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
    const { response } = await requireAdmin()
    if (response) return response

    try {
        const [tenantTxResult, landlordTxResult, withdrawalsResult] = await Promise.all([
            supabaseAdmin
                .from("transactions")
                .select("*, tenant:profiles!tenant_id(id, name, full_name, email)")
                .order("created_at", { ascending: false }),
            supabaseAdmin
                .from("landlord_transactions")
                .select("*, landlord:profiles!landlord_id(id, name, full_name, email)")
                .order("created_at", { ascending: false }),
            supabaseAdmin
                .from("withdrawals")
                .select("*, landlord:profiles!landlord_id(id, name, full_name, email)")
                .order("created_at", { ascending: false }),
        ])

        const tenantTx = (tenantTxResult.data || []).map((t) => ({
            ...t,
            user: t.tenant,
            userRole: "tenant",
        }))

        const landlordTx = (landlordTxResult.data || []).map((t) => ({
            ...t,
            user: t.landlord,
            userRole: "landlord",
        }))

        const combinedTransactions = [...tenantTx, ...landlordTx].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        const withdrawals = withdrawalsResult.data || []

        const pendingWithdrawalsSum = withdrawals
            .filter((w) => w.status === "pending")
            .reduce((acc, w) => acc + (Number(w.amount) || 0), 0)

        const totalInflow = combinedTransactions
            .filter((t) => t.type === "credit" || t.status === "success")
            .reduce((acc, t) => acc + (Number(t.amount) || 0), 0)

        return NextResponse.json({
            transactions: combinedTransactions,
            withdrawals,
            stats: {
                pendingWithdrawalsSum,
                totalInflow,
                totalTransactionsCount: combinedTransactions.length,
            },
        })
    } catch (error: unknown) {
        console.error("GET /api/admin/finances error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to load financial records" },
            { status: 500 }
        )
    }
}
