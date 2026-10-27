import { NextResponse } from "next/server"
import { getCurrentUserWithRole } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"

const categories = new Set(["Plumbing", "Electrical", "Rewiring", "Carpentry", "Painting", "Tiling", "Roofing", "AC Repair", "Waste Disposal", "General Handyman"])
const text = (value: FormDataEntryValue | null, max: number) => typeof value === "string" ? value.trim().slice(0, max) : ""

async function fileExtension(file: File, allowPdf: boolean): Promise<string | null> {
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
    if (file.type === "image/jpeg" && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "jpg"
    if (file.type === "image/png" && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) return "png"
    if (file.type === "image/webp" && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP") return "webp"
    if (allowPdf && file.type === "application/pdf" && new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-") return "pdf"
    return null
}

export async function POST(request: Request) {
    const uploaded: string[] = []
    let saved = false
    let insertAttempted = false
    try {
        const currentUser = await getCurrentUserWithRole()
        if (!currentUser) return NextResponse.json({ error: "Please sign in again" }, { status: 401 })
        if (currentUser.role !== "service_provider") return NextResponse.json({ error: "Provider access required" }, { status: 403 })
        if (!currentUser.user.email_confirmed_at) return NextResponse.json({ error: "Confirm your email before submitting documents" }, { status: 403 })
        const userId = currentUser.user.id
        const { data: existing, error: lookupError } = await supabaseAdmin.from("service_providers").select("id").eq("user_id", userId).maybeSingle()
        if (lookupError) throw lookupError
        if (existing) return NextResponse.json({ success: true, message: "Your provider application is already saved" })

        const contentLength = Number(request.headers.get("content-length") || 0)
        if (contentLength > 3_500_000) return NextResponse.json({ error: "Request body too large" }, { status: 413 })
        const form = await request.formData()
        const fullName = text(form.get("fullName"), 150)
        const phone = text(form.get("phone"), 40)
        const category = text(form.get("category"), 80)
        const state = text(form.get("state"), 80)
        const city = text(form.get("city"), 80)
        const bio = text(form.get("bio"), 2000)
        const experienceValue = text(form.get("experience"), 3)
        const experience = experienceValue ? Number(experienceValue) : NaN
        if (!fullName || !phone || !categories.has(category) || !state || !city || !bio || !Number.isInteger(experience) || experience < 0 || experience > 80) {
            return NextResponse.json({ error: "Complete your contact, trade, experience, and location details" }, { status: 400 })
        }
        const photo = form.get("profilePhoto")
        const document = form.get("governmentId")
        if (!(photo instanceof File) || !(document instanceof File) || !photo.size || !document.size || photo.size > 1_000_000 || document.size > 2_000_000) {
            return NextResponse.json({ error: "Upload a profile photo up to 1 MB and an ID document up to 2 MB" }, { status: 400 })
        }
        const photoExt = await fileExtension(photo, false)
        const documentExt = await fileExtension(document, true)
        if (!photoExt || !documentExt) return NextResponse.json({ error: "Use JPG, PNG, or WebP images; your ID can also be a PDF" }, { status: 400 })
        const folder = `${userId}/${crypto.randomUUID()}`
        const photoPath = `${folder}/profile.${photoExt}`
        const documentPath = `${folder}/identity.${documentExt}`
        for (const [storagePath, file] of [[photoPath, photo], [documentPath, document]] as const) {
            const { error } = await supabaseAdmin.storage.from("provider_documents").upload(storagePath, file, { upsert: false, contentType: file.type })
            if (error) throw error
            uploaded.push(storagePath)
        }
        insertAttempted = true
        const { error } = await supabaseAdmin.from("service_providers").insert({
            id: userId, user_id: userId, full_name: fullName, phone, email: currentUser.user.email,
            certificates: [], skills: [category], trades: [category], service_areas: [`${city}, ${state}`],
            availability_status: "available", verification_status: "pending", provider_type: "individual",
            category, experience_years: experience, location_state: state, location_city: city,
            location: `${city}, ${state}`, bio, verified: false, approval_status: "pending",
            profile_photo_path: photoPath, id_document_path: documentPath, government_id_path: documentPath,
        })
        if (error) throw error
        saved = true
        return NextResponse.json({ success: true, message: "Provider application saved and awaiting review" }, { status: 201 })
    } catch (error) {
        console.error("Provider setup failed:", error instanceof Error ? error.name : "database or storage error")
        return NextResponse.json({ error: "Your account is safe, but setup could not be completed. Keep this page open and try again." }, { status: 500 })
    } finally {
        if (!saved && !insertAttempted && uploaded.length) {
            await supabaseAdmin.storage.from("provider_documents").remove(uploaded).catch(() => {})
        }
    }
}
