import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getCurrentUserWithRole } from "@/lib/supabase-server"

export async function POST(req: Request) {
    try {
        const currentUser = await getCurrentUserWithRole()
        if (!currentUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }
        if (currentUser.role !== "landlord") {
            return NextResponse.json({ error: "Only landlords can pay for maintenance work" }, { status: 403 })
        }

        const body = await req.json()
        const { requestId } = body

        if (!requestId) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
        }

        const { data: request, error: requestError } = await supabaseAdmin
            .from('maintenance_requests')
            .select('rental:rentals!inner(landlord_id)')
            .eq('id', requestId)
            .maybeSingle()

        if (requestError || !request) {
            return NextResponse.json({ error: "Maintenance request not found." }, { status: 404 })
        }

        const rentalData = request.rental as any
        const rental = Array.isArray(rentalData) ? rentalData[0] : rentalData

        if (!rental || rental.landlord_id !== currentUser.user.id) {
            return NextResponse.json({ error: "You can only pay for maintenance at your own properties." }, { status: 403 })
        }

        // 1. Fetch Request & Assignment
        const { data: assignment, error: assignError } = await supabaseAdmin
            .from('repair_assignments')
            .select('*')
            .eq('request_id', requestId)
            .in('status', ['assigned', 'in_progress'])
            .single()

        if (assignError || !assignment) {
            return NextResponse.json({ error: "Active repair assignment not found." }, { status: 404 })
        }

        const cost = Number(assignment.agreed_price) || 0

        // 2. Check Landlord Wallet
        const { data: wallet, error: walletError } = await supabaseAdmin
            .from('landlord_wallets')
            .select('*')
            .eq('landlord_id', currentUser.user.id)
            .single()

        if (walletError || !wallet) {
            return NextResponse.json({ error: "Landlord wallet not found." }, { status: 404 })
        }

        if (Number(wallet.balance) < cost) {
            return NextResponse.json({ error: `Insufficient wallet balance. You need ₦${cost.toLocaleString()} to pay for this job.` }, { status: 400 })
        }

        // 3. Process Transaction
        const newBalance = Number(wallet.balance) - cost

        const { error: walletUpdateError } = await supabaseAdmin
            .from('landlord_wallets')
            .update({ balance: newBalance })
            .eq('id', wallet.id)

        if (walletUpdateError) throw walletUpdateError

        // 3.5 Process Provider Credit
        // Ensure provider wallet exists
        const { data: providerWallet, error: getPWalletError } = await supabaseAdmin
            .from('provider_wallets')
            .select('*')
            .eq('provider_id', assignment.provider_id)
            .single()

        let pWalletId = providerWallet?.id

        if (!providerWallet) {
            // Create wallet if it doesn't exist
            const { data: newPWallet, error: createPWalletError } = await supabaseAdmin
                .from('provider_wallets')
                .insert({
                    provider_id: assignment.provider_id,
                    balance: 0
                })
                .select()
                .single()

            if (createPWalletError) throw createPWalletError
            pWalletId = newPWallet.id
        }

        // Credit the provider wallet
        const currentPBalance = providerWallet ? Number(providerWallet.balance) : 0
        const newPBalance = currentPBalance + cost

        const { error: pWalletUpdateError } = await supabaseAdmin
            .from('provider_wallets')
            .update({ balance: newPBalance })
            .eq('id', pWalletId)

        if (pWalletUpdateError) throw pWalletUpdateError

        // Log Provider transaction
        await supabaseAdmin.from('provider_transactions').insert({
            provider_id: assignment.provider_id,
            type: 'credit',
            amount: cost,
            reference: `maint-pay-${requestId.substring(0, 8)}-${Date.now()}`,
            description: `Payout for completed maintenance job ${requestId.substring(0, 8)}`,
            status: 'success'
        })

        // 4. Update job statuses
        const { error: updateAssignError } = await supabaseAdmin
            .from('repair_assignments')
            .update({ status: 'completed' })
            .eq('id', assignment.id)

        if (updateAssignError) throw updateAssignError

        const { error: updateReqError } = await supabaseAdmin
            .from('maintenance_requests')
            .update({
                status: 'completed',
                landlord_confirmed_at: new Date().toISOString(),
                final_cost: cost
            })
            .eq('id', requestId)

        if (updateReqError) throw updateReqError

        // 5. Update provider's total_jobs_completed if tracking
        const { data: provider } = await supabaseAdmin
            .from('service_providers')
            .select('total_jobs_completed')
            .eq('id', assignment.provider_id)
            .single()

        if (provider) {
            await supabaseAdmin
                .from('service_providers')
                .update({ total_jobs_completed: (provider.total_jobs_completed || 0) + 1 })
                .eq('id', assignment.provider_id)
        }

        // Optional: Create a transaction log
        await supabaseAdmin.from('transactions').insert({
            landlord_id: currentUser.user.id,
            type: 'debit',
            amount: cost,
            reference: `maint-${requestId.substring(0, 8)}-${Date.now()}`,
            description: `Payment for maintenance job ${requestId.substring(0, 8)}`,
            status: 'success'
        })

        return NextResponse.json({ success: true, message: "Payment successful. Job marked as completed." })
    } catch (error: any) {
        console.error("Maintenance payment error:", error)
        return NextResponse.json({ error: error.message || "Failed to process payment." }, { status: 500 })
    }
}
