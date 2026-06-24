import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { leaseId } = body;

        if (!leaseId) {
            return NextResponse.json({ error: 'Missing leaseId' }, { status: 400 });
        }

        // 1. Fetch lease and check status
        const { data: lease, error: fetchError } = await supabaseAdmin
            .from('lease_agreements')
            .select('*, property:properties(title)')
            .eq('id', leaseId)
            .maybeSingle();

        if (fetchError || !lease) {
            return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
        }

        if (lease.status !== 'Draft') {
            return NextResponse.json({ error: 'Only drafts can be sent.' }, { status: 400 });
        }

        if (!lease.tenant_id) {
            return NextResponse.json({ error: 'A tenant must be assigned to this lease before sending.' }, { status: 400 });
        }

        // 2. Update status to 'Sent'
        const { error: updateError } = await supabaseAdmin
            .from('lease_agreements')
            .update({ status: 'Sent' })
            .eq('id', leaseId);

        if (updateError) throw updateError;

        // 3. Notify the tenant
        await supabaseAdmin.rpc('create_notification', {
            p_user_id: lease.tenant_id,
            p_type: 'lease_sent',
            p_title: 'Lease Agreement Ready',
            p_message: `Your landlord has sent a lease agreement for "${lease.property?.title || 'Rental Unit'}" for your review and signature.`,
            p_link: `/dashboard/leases/${leaseId}`
        });

        return NextResponse.json({ success: true, message: 'Lease successfully sent to tenant.' });

    } catch (error: any) {
        console.error('Lease send API error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
