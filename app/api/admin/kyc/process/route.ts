import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { id, type, status, userId, rejectionReason } = body

        if (!id || !type || !status || !userId) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
        }

        if (type === 'tenant') {
            const { error: kycError } = await supabaseAdmin
                .from('tenant_kyc')
                .update({ status, rejection_reason: status === 'rejected' ? rejectionReason : null })
                .eq('id', id)
            if (kycError) throw kycError

            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({ is_verified: status === 'approved', verification_status: status })
                .eq('id', userId)
            if (profileError) throw profileError

        } else if (type === 'provider') {
            const { error: providerError } = await supabaseAdmin
                .from('service_providers')
                .update({ approval_status: status })
                .eq('id', id)
            if (providerError) throw providerError

            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({ is_verified: status === 'approved', verification_status: status })
                .eq('id', userId)
            if (profileError) throw profileError
        }

        // TODO: In the future, trigger an email or in-app notification to the user here.

        return NextResponse.json({ success: true, message: `${type} marked as ${status}` })
    } catch (error: any) {
        console.error("Error processing KYC:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
