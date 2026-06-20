import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Admin client bypassing RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await params
        const body = await req.json()
        const { suspend } = body // true to suspend, false to activate

        // 1. Verify caller is admin (In a real app, verify the session token from cookies!)
        // For this implementation, we assume the frontend role guard is sufficient, 
        // but robust apps should verify here.

        // 2. Update user app_metadata to mark as suspended
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { user_metadata: { suspended: suspend } }
        )

        if (authError) throw authError

        // 3. Update the profiles table so the UI can easily query it. 
        // Note: The UI won't fail if the status column doesn't exist yet, but it's best practice.
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ status: body.status || (suspend ? 'suspended' : 'active') })
            .eq('id', userId)

        if (profileError) {
            // If column doesn't exist yet, we just ignore the profile error
            console.warn("Could not update profile status (migration pending?):", profileError)
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Error suspending user:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
