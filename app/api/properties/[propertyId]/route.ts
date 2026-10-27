import { NextResponse } from "next/server"
import { getCurrentUserWithRole } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"

const PAYMENT_METHODS = new Set(["landlord_bill", "tenant_direct", "prepaid_meter", "included_in_rent"])
const STATUS_VALUES = new Set(["available", "pending", "rented"])
const cleanText = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : ""
const cleanList = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map(item => item.trim().slice(0, 80)).filter(Boolean).slice(0, 50) : []
const cleanImages = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && /^https:\/\//.test(item)).map(item => item.slice(0, 1200)).slice(0, 30) : []

export async function PATCH(request: Request, context: { params: Promise<{ propertyId: string }> }) {
    try {
        const currentUser = await getCurrentUserWithRole()
        if (!currentUser) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        if (currentUser.role !== "landlord") return NextResponse.json({ error: "Landlord access required" }, { status: 403 })

        const { propertyId } = await context.params
        const body = await request.json().catch(() => ({}))
        const { data: owned } = await supabaseAdmin.from("properties").select("id").eq("id", propertyId).eq("landlord_id", currentUser.user.id).maybeSingle()
        if (!owned) return NextResponse.json({ error: "Property not found or not owned by you" }, { status: 404 })

        const price = Number(body.price)
        const update = {
            title: cleanText(body.title, 140),
            type: cleanText(body.type, 80),
            price,
            frequency: cleanText(body.frequency, 24),
            address: cleanText(body.address, 240),
            city: cleanText(body.city, 100),
            state: cleanText(body.state, 100),
            zip_code: cleanText(body.zip_code, 30),
            area: cleanText(body.area, 120),
            bedrooms: Math.max(0, Number(body.bedrooms) || 0),
            bathrooms: Math.max(0, Number(body.bathrooms) || 0),
            toilets: Math.max(0, Number(body.toilets) || 0),
            size: Math.max(0, Number(body.size) || 0),
            square_footage: Math.max(0, Number(body.size) || 0),
            description: cleanText(body.description, 5000),
            amenities: cleanList(body.amenities),
            images: cleanImages(body.images),
            image_url: cleanImages(body.images)[0] || null,
            status: STATUS_VALUES.has(body.status) ? body.status : "available",
            electricity_meter_number: cleanText(body.electricity_meter_number, 80) || null,
            electricity_payment_method: PAYMENT_METHODS.has(body.electricity_payment_method) ? body.electricity_payment_method : "landlord_bill",
            water_payment_method: PAYMENT_METHODS.has(body.water_payment_method) ? body.water_payment_method : "landlord_bill",
            waste_payment_method: PAYMENT_METHODS.has(body.waste_payment_method) ? body.waste_payment_method : "landlord_bill",
            utility_notes: cleanText(body.utility_notes, 1000) || null,
            updated_at: new Date().toISOString(),
        }

        if (!update.title || !update.city || !update.area || !Number.isFinite(price) || price < 0) {
            return NextResponse.json({ error: "Title, city, area, and a valid price are required" }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin.from("properties").update(update)
            .eq("id", propertyId).eq("landlord_id", currentUser.user.id).select("*").single()
        if (error) throw error
        return NextResponse.json({ property: data, message: "Property updated" })
    } catch (error) {
        console.error("Property update error:", error)
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update property" }, { status: 500 })
    }
}
