import { NextResponse } from "next/server"
import { getCurrentUserWithRole } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { parseBillDefaults } from "@/lib/bill-defaults"

export async function GET() {
    try {
        const currentUser = await getCurrentUserWithRole()
        if (!currentUser) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        if (currentUser.role !== "landlord") return NextResponse.json({ error: "Landlord access required" }, { status: 403 })

        const defaults = parseBillDefaults(currentUser.user.user_metadata?.bill_defaults ?? {})
        return NextResponse.json({ defaults }, { headers: { "Cache-Control": "private, no-store" } })
    } catch (error) {
        console.error("Load bill defaults error:", error)
        return NextResponse.json({ error: "Unable to load saved bill prices. Please try again." }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const currentUser = await getCurrentUserWithRole()
        if (!currentUser) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        if (currentUser.role !== "landlord") return NextResponse.json({ error: "Landlord access required" }, { status: 403 })

        let defaults
        try {
            const text = await request.text()
            if (text.length > 8192) return NextResponse.json({ error: "Bill defaults are too large" }, { status: 413 })
            const body = JSON.parse(text)
            defaults = parseBillDefaults(body?.defaults)
        } catch (error) {
            return NextResponse.json({ error: error instanceof SyntaxError ? "Invalid request" : error instanceof Error ? error.message : "Invalid bill defaults" }, { status: 400 })
        }

        const { error } = await supabaseAdmin.auth.admin.updateUserById(currentUser.user.id, {
            user_metadata: { bill_defaults: defaults },
        })
        if (error) throw error
        return NextResponse.json({ defaults, message: "Bill prices saved. Existing bills are unchanged." })
    } catch (error) {
        console.error("Save bill defaults error:", error)
        return NextResponse.json({ error: "Unable to save bill prices. Please try again." }, { status: 500 })
    }
}
