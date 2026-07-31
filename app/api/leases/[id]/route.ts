import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getCurrentUserWithRole } from '@/lib/supabase-server';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUserWithRole();
        if (!currentUser) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Missing lease ID' }, { status: 400 });
        }

        // Fetch lease with full joins
        const { data: lease, error } = await supabaseAdmin
            .from('lease_agreements')
            .select(`
                *, 
                property:properties(*), 
                tenant:profiles!tenant_id(id, name, email, phone, full_name), 
                landlord:profiles!landlord_id(id, name, email, phone, full_name),
                signatures:lease_signatures(*)
            `)
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        if (!lease) {
            return NextResponse.json({ error: 'Lease agreement not found' }, { status: 404 });
        }

        const isParticipant = lease.landlord_id === currentUser.user.id || lease.tenant_id === currentUser.user.id;
        if (!isParticipant && currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'You do not have access to this lease agreement' }, { status: 403 });
        }

        const { data: completedInspection, error: inspectionError } = await supabaseAdmin
            .from('inspection_bookings')
            .select('id')
            .eq('property_id', lease.property_id)
            .eq('tenant_id', lease.tenant_id)
            .eq('status', 'completed')
            .limit(1)
            .maybeSingle();

        if (inspectionError) throw inspectionError;

        return NextResponse.json({
            success: true,
            lease,
            inspectionCompleted: Boolean(completedInspection)
        });

    } catch (error: any) {
        console.error('Fetch lease API error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
