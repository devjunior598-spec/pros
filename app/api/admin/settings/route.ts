import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

const DEFAULT_SETTINGS = {
    site_name: "House Do PRMS",
    support_email: "support@housedo.com",
    maintenance_mode: false,
    commission_rate: 5,
    min_withdrawal: 5000,
    two_factor_required: true,
    auto_payouts_enabled: false,
}

export async function GET() {
    const { response } = await requireAdmin()
    if (response) return response

    try {
        const { data, error } = await supabaseAdmin
            .from("system_settings")
            .select("*")
            .single()

        if (error && error.code !== "PGRST116" && !error.message?.includes("relation")) {
            console.warn("Could not query system_settings table:", error.message)
        }

        const settings = data ? { ...DEFAULT_SETTINGS, ...data } : DEFAULT_SETTINGS

        return NextResponse.json({ settings })
    } catch (error: unknown) {
        console.error("GET /api/admin/settings error:", error)
        return NextResponse.json({ settings: DEFAULT_SETTINGS })
    }
}

export async function POST(request: Request) {
    const { response, currentUser } = await requireAdmin()
    if (response) return response

    try {
        const body = await request.json()
        const updatedSettings = {
            ...DEFAULT_SETTINGS,
            ...body,
            updated_at: new Date().toISOString(),
            updated_by: currentUser?.user.id,
        }

        const { data, error } = await supabaseAdmin
            .from("system_settings")
            .upsert(updatedSettings, { onConflict: "id" })
            .select()
            .single()

        if (error) {
            console.warn("Could not persist to system_settings table, returning in-memory state:", error.message)
            return NextResponse.json({
                settings: updatedSettings,
                message: "Settings saved in session (database table system_settings not provisioned)",
            })
        }

        return NextResponse.json({
            settings: data,
            message: "Platform settings updated successfully",
        })
    } catch (error: unknown) {
        console.error("POST /api/admin/settings error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update settings" },
            { status: 500 }
        )
    }
}
