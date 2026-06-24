import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            leaseId,
            userId,
            role,
            signerName,
            signatureType,
            signatureValue
        } = body;

        if (!leaseId || !userId || !role || !signerName || !signatureType || !signatureValue) {
            return NextResponse.json({ error: 'Missing required signature fields' }, { status: 400 });
        }

        // Get IP and User Agent automatically
        const userAgent = req.headers.get('user-agent') || 'Unknown';
        const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';

        // 1. Fetch lease
        const { data: lease, error: fetchError } = await supabaseAdmin
            .from('lease_agreements')
            .select('*, property:properties(title)')
            .eq('id', leaseId)
            .maybeSingle();

        if (fetchError || !lease) {
            return NextResponse.json({ error: 'Lease agreement not found' }, { status: 404 });
        }

        // 2. Validate current status
        if (lease.status === 'Fully Signed' || lease.status === 'Cancelled' || lease.status === 'Expired') {
            return NextResponse.json({ error: 'This lease is locked and cannot be signed.' }, { status: 400 });
        }

        // 3. Check for existing signature by this role
        const { data: existingSigs, error: sigCheckError } = await supabaseAdmin
            .from('lease_signatures')
            .select('id')
            .eq('lease_id', leaseId)
            .eq('role', role);

        if (sigCheckError) throw sigCheckError;

        if (existingSigs && existingSigs.length > 0) {
            return NextResponse.json({ error: `This lease has already been signed by the ${role}.` }, { status: 400 });
        }

        // 4. Insert new signature record
        const { error: insertSigError } = await supabaseAdmin
            .from('lease_signatures')
            .insert({
                lease_id: leaseId,
                user_id: userId,
                role,
                signer_name: signerName,
                signature_type: signatureType,
                signature_value: signatureValue,
                ip_address: ipAddress,
                user_agent: userAgent
            });

        if (insertSigError) throw insertSigError;

        // 5. Determine new status of the lease
        let nextStatus = lease.status;
        const currentSigsCount = (existingSigs ? existingSigs.length : 0) + 1; // including the one we just added

        // Check if the other party has signed
        const otherRole = role === 'tenant' ? 'landlord' : 'tenant';
        const { data: otherSigs } = await supabaseAdmin
            .from('lease_signatures')
            .select('id')
            .eq('lease_id', leaseId)
            .eq('role', otherRole);

        const otherSigned = otherSigs && otherSigs.length > 0;

        if (otherSigned) {
            nextStatus = 'Fully Signed';
        } else {
            nextStatus = role === 'tenant' ? 'Tenant Signed' : 'Landlord Signed';
        }

        // Update lease agreement status
        const { error: updateError } = await supabaseAdmin
            .from('lease_agreements')
            .update({ status: nextStatus, updated_at: new Date().toISOString() })
            .eq('id', leaseId);

        if (updateError) throw updateError;

        // 6. Notifications
        const propTitle = lease.property?.title || 'Rental Unit';
        if (nextStatus === 'Fully Signed') {
            // Notify Tenant
            if (lease.tenant_id) {
                await supabaseAdmin.rpc('create_notification', {
                    p_user_id: lease.tenant_id,
                    p_type: 'lease_completed',
                    p_title: 'Lease Fully Executed',
                    p_message: `The lease agreement for "${propTitle}" is now fully signed by both parties.`,
                    p_link: `/dashboard/leases/${leaseId}`
                });
            }
            // Notify Landlord
            await supabaseAdmin.rpc('create_notification', {
                p_user_id: lease.landlord_id,
                p_type: 'lease_completed',
                p_title: 'Lease Fully Executed',
                p_message: `The lease agreement for "${propTitle}" is now fully signed by both parties.`,
                p_link: `/dashboard/leases/${leaseId}`
            });
        } else {
            // Partial sign - notify counterparty
            const recipientId = role === 'tenant' ? lease.landlord_id : lease.tenant_id;
            if (recipientId) {
                await supabaseAdmin.rpc('create_notification', {
                    p_user_id: recipientId,
                    p_type: 'lease_signed',
                    p_title: 'Lease Signed',
                    p_message: `The ${role} has signed the lease agreement for "${propTitle}". Awaiting your signature.`,
                    p_link: `/dashboard/leases/${leaseId}`
                });
            }
        }

        return NextResponse.json({ success: true, status: nextStatus });

    } catch (error: any) {
        console.error('Lease sign API error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
