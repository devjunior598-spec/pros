import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(req: NextRequest) {
    try {
        const { data: items, error } = await supabaseAdmin
            .from("inventory_items")
            .select("*")
            .order("created_at", { ascending: false })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ items })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to fetch inventory" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authErr } = await supabase.auth.getUser()

        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { name, category, quantity, minThreshold, unitCost, location } = body

        if (!name || !category || quantity === undefined) {
            return NextResponse.json({ error: "Missing required inventory fields" }, { status: 400 })
        }

        const itemCode = `INV-${category.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`

        const { data: item, error } = await supabaseAdmin
            .from("inventory_items")
            .insert({
                item_code: itemCode,
                name,
                category,
                quantity: Number(quantity),
                min_threshold: Number(minThreshold || 5),
                unit_cost: Number(unitCost || 0),
                location: location || "Main Warehouse"
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ item, message: "Inventory item added successfully" })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to add inventory item" }, { status: 500 })
    }
}
