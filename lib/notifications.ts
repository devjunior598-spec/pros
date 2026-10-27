import { supabaseAdmin } from "@/lib/supabase-admin"

type NotificationPayload = {
    userId: string
    type: string
    title: string
    message: string
    link?: string | null
}

export async function createNotification(payload: NotificationPayload) {
    const { error: insertError } = await supabaseAdmin
        .from("notifications")
        .insert({
            user_id: payload.userId,
            type: payload.type,
            title: payload.title,
            message: payload.message,
            link: payload.link || null,
        })

    if (!insertError) return

    console.error("Notification insert error:", insertError)

    const { error: rpcError } = await supabaseAdmin.rpc("create_notification", {
        p_user_id: payload.userId,
        p_type: payload.type,
        p_title: payload.title,
        p_message: payload.message,
        p_link: payload.link || null,
    })

    if (rpcError) {
        console.error("Notification RPC error:", rpcError)
        throw rpcError
    }
}
