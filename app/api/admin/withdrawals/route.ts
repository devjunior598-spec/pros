import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(req: Request) {
    try {
        // In a real app, verify admin session
        const { data, error } = await supabaseAdmin
            .from('withdrawals')
            .select(`*, landlord:profiles (name, email)`)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ withdrawals: data })
    } catch (error: any) {
        console.error("Error fetching admin withdrawals:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
