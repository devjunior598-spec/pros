import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
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
                tenant:profiles!tenant_id(id, name, email, phone, fullname), 
                landlord:profiles!landlord_id(id, name, email, phone, fullname),
                signatures:lease_signatures(*)
            `)
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        if (!lease) {
            return NextResponse.json({ error: 'Lease agreement not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, lease });

    } catch (error: any) {
        console.error('Fetch lease API error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
