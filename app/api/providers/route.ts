import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const category = searchParams.get("category")

        let query = supabaseAdmin.from("service_providers").select("*, profile:profiles(name, email, phone)").order("rating_average", { ascending: false })

        if (category) {
            query = query.eq("trade_category", category)
        }

        const { data: providers, error } = await query
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ providers })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to fetch service providers" }, { status: 500 })
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
        const {
            tradeCategory,
            skills,
            yearsExperience,
            photoUrl,
            idDocumentUrl,
            address,
            phone,
            bankName,
            bankAccountNumber,
            bankAccountName,
            certificates,
            serviceAreas
        } = body

        if (!tradeCategory || !phone || !bankAccountNumber) {
            return NextResponse.json({ error: "Missing required provider registration fields" }, { status: 400 })
        }

        const { data: provider, error } = await supabaseAdmin
            .from("service_providers")
            .upsert({
                id: user.id,
                trade_category: tradeCategory,
                skills: skills || [],
                years_experience: Number(yearsExperience || 1),
                photo_url: photoUrl || null,
                id_document_url: idDocumentUrl || null,
                address: address || "",
                phone,
                bank_name: bankName || "",
                bank_account_number: bankAccountNumber || "",
                bank_account_name: bankAccountName || "",
                certificates: certificates || [],
                service_areas: serviceAreas || [],
                verification_status: "Pending",
                is_available: true
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ provider, message: "Service provider registered successfully. Verification pending admin review." })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to register service provider" }, { status: 500 })
    }
}
