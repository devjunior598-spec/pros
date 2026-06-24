import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            propertyId,
            tenantId,
            landlordId,
            name,
            email,
            phone,
            date,
            time,
            type,
            notes
        } = body;

        if (!propertyId || !landlordId || !name || !email || !phone || !date || !time || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Prevent double booking: Check if landlord already has a viewing scheduled at this date and time
        // We check for statuses 'pending' or 'approved'
        const { data: existingBookings, error: checkError } = await supabaseAdmin
            .from('inspection_bookings')
            .select('id')
            .eq('landlord_id', landlordId)
            .eq('inspection_date', date)
            .eq('inspection_time', time)
            .in('status', ['pending', 'approved']);

        if (checkError) {
            console.error('Error checking double bookings:', checkError);
        }

        if (existingBookings && existingBookings.length > 0) {
            return NextResponse.json({ 
                error: 'This slot is already booked. Please choose another date or time.' 
            }, { status: 400 });
        }

        // 2. Insert the inspection booking
        const { data: booking, error: insertError } = await supabaseAdmin
            .from('inspection_bookings')
            .insert({
                property_id: propertyId,
                tenant_id: tenantId || null,
                landlord_id: landlordId,
                name,
                email,
                phone,
                inspection_date: date,
                inspection_time: time,
                inspection_type: type,
                notes: notes || null,
                status: 'pending'
            })
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        // 3. Notify the landlord
        await supabaseAdmin.rpc('create_notification', {
            p_user_id: landlordId,
            p_type: 'inspection_booked',
            p_title: 'New Inspection Requested',
            p_message: `${name} requested a ${type} on ${date} at ${time}.`,
            p_link: '/dashboard/inspections'
        });

        return NextResponse.json({ success: true, booking });
    } catch (error: any) {
        console.error('Inspection booking error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
