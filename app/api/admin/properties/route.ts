import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const page = parseInt(url.searchParams.get("page") || "1", 10)
        const limit = parseInt(url.searchParams.get("limit") || "12", 10)

        const from = (page - 1) * limit
        const to = from + limit - 1

        const { data, count, error } = await supabaseAdmin
            .from('properties')
            .select(`
                *,
                landlord:profiles (name, email),
                rentals (
                    id,
                    status,
                    tenant:profiles (name)
                )
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to)

        if (error) throw error

        const totalPages = Math.ceil((count || 0) / limit)

        return NextResponse.json({
            properties: data,
            totalPages,
            totalCount: count
        })
    } catch (error: any) {
        console.error("Error fetching admin properties:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
