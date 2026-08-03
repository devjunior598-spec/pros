import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getCurrentUserWithRole } from "@/lib/supabase-server"

type RentalRow = { id: string; property_id: string; landlord_id: string; tenant_id: string }

export async function GET() {
    try {
        const currentUser = await getCurrentUserWithRole()
        if (!currentUser) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        if (currentUser.role !== "landlord" && currentUser.role !== "tenant") return NextResponse.json({ conversations: [] })

        const participantColumn = currentUser.role === "landlord" ? "landlord_id" : "tenant_id"

        // Fetch rentals for auto-upserting conversations
        const { data: rentals, error: rentalsError } = await supabaseAdmin
            .from("rentals").select("id, property_id, landlord_id, tenant_id")
            .eq(participantColumn, currentUser.user.id)
        if (rentalsError) throw rentalsError

        const eligibleRentals = (rentals || []).filter(
            (rental): rental is RentalRow => Boolean(rental.id && rental.property_id && rental.landlord_id && rental.tenant_id)
        )

        if (eligibleRentals.length > 0) {
            await supabaseAdmin.from("conversations").upsert(
                eligibleRentals.map((rental) => ({ rental_id: rental.id, landlord_id: rental.landlord_id, tenant_id: rental.tenant_id })),
                { onConflict: "rental_id", ignoreDuplicates: true }
            ).select()
        }

        // Fetch all conversations for this user
        const { data: conversations, error: conversationsError } = await supabaseAdmin
            .from("conversations")
            .select("id, rental_id, landlord_id, tenant_id, created_at")
            .eq(participantColumn, currentUser.user.id)
        if (conversationsError) throw conversationsError

        if (!conversations || conversations.length === 0) {
            return NextResponse.json({ conversations: [] })
        }

        const conversationIds = conversations.map((conversation) => conversation.id)
        const profileIds = [...new Set(conversations.flatMap((conversation) => [conversation.landlord_id, conversation.tenant_id]))]
        const rentalById = new Map(eligibleRentals.map((rental) => [rental.id, rental]))
        const propertyIds = [...new Set(eligibleRentals.map((rental) => rental.property_id))]

        const [profilesResult, propertiesResult, messagesResult] = await Promise.all([
            profileIds.length > 0
                ? supabaseAdmin.from("profiles").select("id, name, full_name, is_verified, profile_image_url").in("id", profileIds)
                : Promise.resolve({ data: [], error: null }),
            propertyIds.length > 0
                ? supabaseAdmin.from("properties").select("id, title, address").in("id", propertyIds)
                : Promise.resolve({ data: [], error: null }),
            conversationIds.length > 0
                ? supabaseAdmin.from("messages").select("id, conversation_id, sender_id, message, type, file_url, read_at, created_at").in("conversation_id", conversationIds).order("created_at", { ascending: false })
                : Promise.resolve({ data: [], error: null })
        ])

        if (profilesResult.error) throw profilesResult.error
        if (propertiesResult.error) throw propertiesResult.error
        if (messagesResult.error) throw messagesResult.error

        const profileById = new Map((profilesResult.data || []).map((profile) => [profile.id, profile]))
        const propertyById = new Map((propertiesResult.data || []).map((property) => [property.id, property]))

        const result = conversations.map((conversation) => {
            const rental = rentalById.get(conversation.rental_id)
            const otherUserId = currentUser.role === "landlord" ? conversation.tenant_id : conversation.landlord_id
            const conversationMessages = (messagesResult.data || []).filter((message) => message.conversation_id === conversation.id)
            const otherProfile = profileById.get(otherUserId)
            return {
                ...conversation,
                otherUser: otherProfile ? {
                    id: otherProfile.id,
                    name: otherProfile.full_name || otherProfile.name || (currentUser.role === "landlord" ? "Tenant" : "Landlord"),
                    isVerified: Boolean(otherProfile.is_verified),
                    avatarUrl: otherProfile.profile_image_url
                } : { id: otherUserId, name: currentUser.role === "landlord" ? "Tenant" : "Landlord", isVerified: false, avatarUrl: null },
                property: rental ? propertyById.get(rental.property_id) || null : null,
                lastMessage: conversationMessages[0] || null,
                unreadCount: conversationMessages.filter((message) => message.sender_id !== currentUser.user.id && !message.read_at).length
            }
        }).sort((a, b) => new Date(b.lastMessage?.created_at || b.created_at).getTime() - new Date(a.lastMessage?.created_at || a.created_at).getTime())

        return NextResponse.json({ conversations: result })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load conversations"
        console.error("Messages conversations API error:", error)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const currentUser = await getCurrentUserWithRole()
        if (!currentUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        const body = await req.json().catch(() => ({}))
        const { landlordId, propertyId } = body
        const tenantId = currentUser.user.id

        if (!landlordId) {
            return NextResponse.json({ error: "Landlord ID is required" }, { status: 400 })
        }

        // 1. Check for existing conversation between tenant and landlord
        const { data: existingConv } = await supabaseAdmin
            .from("conversations")
            .select("id")
            .eq("tenant_id", tenantId)
            .eq("landlord_id", landlordId)
            .maybeSingle()

        if (existingConv) {
            return NextResponse.json({ conversationId: existingConv.id })
        }

        // 2. Find or create associated rental record
        let rentalId = null
        if (propertyId) {
            const { data: rental } = await supabaseAdmin
                .from("rentals")
                .select("id")
                .eq("tenant_id", tenantId)
                .eq("property_id", propertyId)
                .maybeSingle()
            if (rental) rentalId = rental.id
        }

        if (!rentalId) {
            const { data: anyRental } = await supabaseAdmin
                .from("rentals")
                .select("id")
                .eq("tenant_id", tenantId)
                .eq("landlord_id", landlordId)
                .maybeSingle()
            if (anyRental) rentalId = anyRental.id
        }

        if (!rentalId) {
            const targetPropId = propertyId || (
                await supabaseAdmin.from("properties").select("id").eq("landlord_id", landlordId).limit(1).maybeSingle()
            ).data?.id

            if (targetPropId) {
                const { data: newRental } = await supabaseAdmin
                    .from("rentals")
                    .insert({
                        property_id: targetPropId,
                        tenant_id: tenantId,
                        landlord_id: landlordId,
                        status: "pending"
                    })
                    .select("id")
                    .single()
                if (newRental) rentalId = newRental.id
            }
        }

        if (!rentalId) {
            return NextResponse.json({ error: "No rental or property found for landlord" }, { status: 400 })
        }

        // 3. Create conversation using admin client
        const { data: newConv, error: createError } = await supabaseAdmin
            .from("conversations")
            .insert({
                tenant_id: tenantId,
                landlord_id: landlordId,
                rental_id: rentalId
            })
            .select("id")
            .single()

        if (createError) throw createError

        return NextResponse.json({ conversationId: newConv.id })
    } catch (error) {
        console.error("Error creating conversation API:", error)
        const message = error instanceof Error ? error.message : (error as any)?.message || "Failed to create conversation"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
