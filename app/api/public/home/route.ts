import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const [properties, tenants, landlords, transactions, listings] = await Promise.all([
            supabaseAdmin.from("properties").select("*", { count: "exact", head: true }).eq("status", "available"),
            supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "tenant"),
            supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "landlord").eq("is_verified", true),
            supabaseAdmin.from("payments").select("*", { count: "exact", head: true }).eq("status", "success").gte("created_at", thirtyDaysAgo),
            supabaseAdmin.from("properties").select("id, title, price, address, city, bedrooms, bathrooms, images, image_url").eq("status", "available").order("created_at", { ascending: false }).limit(3)
        ])
        if (listings.error) throw listings.error
        return NextResponse.json({
            stats: { properties: properties.count || 0, tenants: tenants.count || 0, landlords: landlords.count || 0, txns: transactions.count || 0 },
            featuredProperties: listings.data || []
        })
    } catch (error) {
        console.error("Public homepage data error:", error)
        return NextResponse.json({ error: "Unable to load current platform data" }, { status: 500 })
    }
}
