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
        const { data: rentals, error: rentalsError } = await supabaseAdmin
            .from("rentals").select("id, property_id, landlord_id, tenant_id")
            .eq(participantColumn, currentUser.user.id).in("status", ["approved", "active"])
        if (rentalsError) throw rentalsError

        const eligibleRentals = (rentals || []).filter(
            (rental): rental is RentalRow => Boolean(rental.id && rental.property_id && rental.landlord_id && rental.tenant_id)
        )
        if (eligibleRentals.length === 0) return NextResponse.json({ conversations: [] })

        const { error: upsertError } = await supabaseAdmin.from("conversations").upsert(
            eligibleRentals.map((rental) => ({ rental_id: rental.id, landlord_id: rental.landlord_id, tenant_id: rental.tenant_id })),
            { onConflict: "rental_id" }
        )
        if (upsertError) throw upsertError

        const rentalIds = eligibleRentals.map((rental) => rental.id)
        const { data: conversations, error: conversationsError } = await supabaseAdmin
            .from("conversations").select("id, rental_id, landlord_id, tenant_id, created_at").in("rental_id", rentalIds)
        if (conversationsError) throw conversationsError

        const conversationIds = (conversations || []).map((conversation) => conversation.id)
        const profileIds = [...new Set(eligibleRentals.flatMap((rental) => [rental.landlord_id, rental.tenant_id]))]
        const propertyIds = [...new Set(eligibleRentals.map((rental) => rental.property_id))]
        const [profilesResult, propertiesResult, messagesResult] = await Promise.all([
            supabaseAdmin.from("profiles").select("id, name, full_name, is_verified, profile_image_url").in("id", profileIds),
            supabaseAdmin.from("properties").select("id, title, address").in("id", propertyIds),
            supabaseAdmin.from("messages").select("id, conversation_id, sender_id, message, type, file_url, read_at, created_at").in("conversation_id", conversationIds).order("created_at", { ascending: false })
        ])
        if (profilesResult.error) throw profilesResult.error
        if (propertiesResult.error) throw propertiesResult.error
        if (messagesResult.error) throw messagesResult.error

        const profileById = new Map((profilesResult.data || []).map((profile) => [profile.id, profile]))
        const propertyById = new Map((propertiesResult.data || []).map((property) => [property.id, property]))
        const rentalById = new Map(eligibleRentals.map((rental) => [rental.id, rental]))

        const result = (conversations || []).map((conversation) => {
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
