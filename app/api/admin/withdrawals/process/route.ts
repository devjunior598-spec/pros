import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { withdrawalId, status, landlordId, amount } = body

        if (!withdrawalId || !status || !landlordId || typeof amount !== 'number') {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // 1. Update the withdrawal status
        const { error: updateError } = await supabaseAdmin
            .from('withdrawals')
            .update({ status })
            .eq('id', withdrawalId)

        if (updateError) throw updateError

        // 2. If status is 'failed' or 'rejected', refund the landlord's balance
        // The original SQL trigger deducts balance ON APPROVAL. 
        // Wait, let's verify: The SQL says "deduct ONLY ON APPROVAL". 
        // If it deducts ONLY on approval, then if it fails, we do NOT need to refund!
        // Because the balance was never deducted when it was 'pending'.

        // Let's implement robust logging or receipt generation here if needed.
        // For now, updating the status is sufficient because the trigger handles the rest.

        return NextResponse.json({ success: true, message: `Withdrawal marked as ${status}` })
    } catch (error: any) {
        console.error("Error processing withdrawal:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
