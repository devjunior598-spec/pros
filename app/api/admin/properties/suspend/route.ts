import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { propertyId, suspend } = body // suspend is boolean

        if (!propertyId) {
            return NextResponse.json({ error: "Missing propertyId" }, { status: 400 })
        }

        const newStatus = suspend ? 'suspended' : 'available'

        const { error } = await supabaseAdmin
            .from('properties')
            .update({ status: newStatus })
            .eq('id', propertyId)

        if (error) throw error

        return NextResponse.json({ success: true, message: `Property marked as ${newStatus}` })
    } catch (error: any) {
        console.error("Error suspending property:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
