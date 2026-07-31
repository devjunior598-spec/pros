import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getCurrentUserWithRole } from "@/lib/supabase-server"

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUserWithRole()
        if (!currentUser) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

        const { conversationId, messageId } = await request.json()
        if (!conversationId || !messageId) return NextResponse.json({ error: "Conversation and message are required" }, { status: 400 })

        const { data: conversation, error: conversationError } = await supabaseAdmin
            .from("conversations").select("landlord_id, tenant_id").eq("id", conversationId).maybeSingle()
        if (conversationError) throw conversationError
        if (!conversation || (conversation.landlord_id !== currentUser.user.id && conversation.tenant_id !== currentUser.user.id)) {
            return NextResponse.json({ error: "You do not have access to this conversation" }, { status: 403 })
        }

        const { error: updateError } = await supabaseAdmin.from("messages")
            .update({ read_at: new Date().toISOString(), is_read: true })
            .eq("id", messageId).eq("conversation_id", conversationId)
            .neq("sender_id", currentUser.user.id).is("read_at", null)
        if (updateError) throw updateError

        return NextResponse.json({ success: true })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update read receipt"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
