import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(req: Request) {
    try {
        // 1. Fetch Tenant KYCs
        const { data: tenantData, error: tenantError } = await supabaseAdmin
            .from('tenant_kyc')
            .select(`*, tenant:profiles (name, email)`)
            .order('created_at', { ascending: false })

        if (tenantError) throw tenantError

        // 2. Fetch Provider Approvals
        const { data: providerData, error: providerError } = await supabaseAdmin
            .from('service_providers')
            .select(`*, user:profiles (name, email)`)
            .order('created_at', { ascending: false })

        if (providerError) throw providerError

        return NextResponse.json({ tenants: tenantData || [], providers: providerData || [] })
    } catch (error: any) {
        console.error("Error fetching KYC data:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
