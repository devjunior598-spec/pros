import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
    try {
        const { data: listings, error } = await supabaseAdmin
            .from("properties")
            .select("id, title, price, sale_price, listing_purpose, frequency, type, lot_size_sqft, address, city, state, zip_code, bedrooms, bathrooms, images, image_url")
            .eq("country", "United States")
            .eq("status", "available")
            .eq("verification_status", "approved")
            .eq("publication_status", "published")
            .order("created_at", { ascending: false })
            .limit(3)

        if (error) throw error
        return NextResponse.json({ featuredProperties: listings || [] })
    } catch (error) {
        console.error("Public homepage data error:", error)
        return NextResponse.json({ error: "Unable to load current platform data" }, { status: 500 })
    }
}
