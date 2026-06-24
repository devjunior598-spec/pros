import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { id, type, status, userId, propertyId, rejectionReason, notes } = body

        if (!id || !type || !status) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
        }

        if (type === 'tenant') {
            const { error: kycError } = await supabaseAdmin
                .from('tenant_kyc')
                .update({ 
                    status, 
                    rejection_reason: status === 'rejected' ? rejectionReason : null,
                    notes: notes || null
                })
                .eq('id', id)
            if (kycError) throw kycError

            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({ is_verified: status === 'approved', verification_status: status })
                .eq('id', userId)
            if (profileError) throw profileError

            // Trigger notification
            const title = status === 'approved' ? 'Identity Verified' : status === 'rejected' ? 'Verification Rejected' : 'More Information Required';
            const msg = status === 'approved' 
                ? 'Congratulations! Your tenant identity verification has been approved. A trust badge is now displayed on your account.'
                : `Your verification request was marked as ${status}. ${rejectionReason ? 'Reason: ' + rejectionReason : ''} ${notes ? 'Notes: ' + notes : ''}`;

            await supabaseAdmin.rpc('create_notification', {
                p_user_id: userId,
                p_type: 'verification_update',
                p_title: title,
                p_message: msg,
                p_link: '/dashboard/verification'
            });

        } else if (type === 'landlord') {
            const { error: kycError } = await supabaseAdmin
                .from('landlord_kyc')
                .update({ 
                    status, 
                    rejection_reason: status === 'rejected' ? rejectionReason : null,
                    notes: notes || null
                })
                .eq('id', id)
            if (kycError) throw kycError

            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({ is_verified: status === 'approved', verification_status: status })
                .eq('id', userId)
            if (profileError) throw profileError

            // Trigger notification
            const title = status === 'approved' ? 'Landlord Verification Approved' : status === 'rejected' ? 'Landlord Verification Rejected' : 'Landlord Docs Pending Update';
            const msg = status === 'approved'
                ? 'Congratulations! Your landlord identity verification request has been approved. A verified landlord badge is now active on your profile.'
                : `Your landlord verification update: marked as ${status}. ${rejectionReason ? 'Reason: ' + rejectionReason : ''} ${notes ? 'Notes: ' + notes : ''}`;

            await supabaseAdmin.rpc('create_notification', {
                p_user_id: userId,
                p_type: 'verification_update',
                p_title: title,
                p_message: msg,
                p_link: '/dashboard/verification'
            });

        } else if (type === 'property') {
            const { error: kycError } = await supabaseAdmin
                .from('property_verifications')
                .update({ 
                    status, 
                    rejection_reason: status === 'rejected' ? rejectionReason : null,
                    notes: notes || null
                })
                .eq('id', id)
            if (kycError) throw kycError

            const { error: propError } = await supabaseAdmin
                .from('properties')
                .update({ verification_status: status })
                .eq('id', propertyId)
            if (propError) throw propError

            // Get property title for notification
            const { data: prop } = await supabaseAdmin
                .from('properties')
                .select('title, landlord_id')
                .eq('id', propertyId)
                .single()

            if (prop) {
                const title = status === 'approved' ? 'Property Verification Approved' : status === 'rejected' ? 'Property Verification Rejected' : 'Property Documents Pending Update';
                const msg = status === 'approved'
                    ? `Congratulations! Verification for your property "${prop.title}" has been approved. A verified property badge is now displayed on its listing page.`
                    : `Verification request for property "${prop.title}" marked as ${status}. ${rejectionReason ? 'Reason: ' + rejectionReason : ''} ${notes ? 'Notes: ' + notes : ''}`;

                await supabaseAdmin.rpc('create_notification', {
                    p_user_id: prop.landlord_id,
                    p_type: 'verification_update',
                    p_title: title,
                    p_message: msg,
                    p_link: '/dashboard/verification'
                });
            }

        } else if (type === 'provider') {
            const { error: providerError } = await supabaseAdmin
                .from('service_providers')
                .update({ approval_status: status })
                .eq('id', id)
            if (providerError) throw providerError

            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({ is_verified: status === 'approved', verification_status: status })
                .eq('id', userId)
            if (profileError) throw profileError

            // Trigger notification
            const title = status === 'approved' ? 'Provider Profile Approved' : 'Provider Profile Update';
            const msg = status === 'approved' 
                ? 'Your Service Provider registry profile has been approved! You can now browse and apply for maintenance jobs.'
                : `Your provider profile has been marked as ${status}.`;

            await supabaseAdmin.rpc('create_notification', {
                p_user_id: userId,
                p_type: 'verification_update',
                p_title: title,
                p_message: msg,
                p_link: '/dashboard'
            });
        }

        return NextResponse.json({ success: true, message: `${type} marked as ${status}` })
    } catch (error: any) {
        console.error("Error processing KYC:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
