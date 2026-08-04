import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            propertyId,
            tenantId,
            name,
            email,
            phone,
            date,
            time,
            type,
            notes
        } = body;

        if (!propertyId || !name || !email || !phone || !date || !time || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data: property, error: propertyError } = await supabaseAdmin
            .from('properties')
            .select('landlord_id')
            .eq('id', propertyId)
            .maybeSingle();

        if (propertyError) throw propertyError;

        const targetLandlordId = property?.landlord_id;

        if (!targetLandlordId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Prevent double booking: Check if landlord already has a viewing scheduled at this date and time
        // We check for statuses 'pending' or 'approved'
        const { data: existingBookings, error: checkError } = await supabaseAdmin
            .from('inspection_bookings')
            .select('id')
            .eq('landlord_id', targetLandlordId)
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
                landlord_id: targetLandlordId,
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
        try {
            const { error: notificationError } = await supabaseAdmin.from('notifications').insert({
                user_id: targetLandlordId,
                type: 'inspection_booked',
                title: 'New Inspection Requested',
                message: `${name} requested a ${type} on ${date} at ${time}.`,
                link: '/dashboard/inspections'
            });
            if (notificationError) throw notificationError;
        } catch (notifErr) {
            console.error('Notification insertion error:', notifErr);
            // Fallback RPC
            try {
                await supabaseAdmin.rpc('create_notification', {
                    p_user_id: targetLandlordId,
                    p_type: 'inspection_booked',
                    p_title: 'New Inspection Requested',
                    p_message: `${name} requested a ${type} on ${date} at ${time}.`,
                    p_link: '/dashboard/inspections'
                });
            } catch (rpcErr) {
                console.error('Notification RPC error:', rpcErr);
            }
        }

        return NextResponse.json({ success: true, booking });
    } catch (error: unknown) {
        console.error('Inspection booking error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal Server Error'
        }, { status: 500 });
    }
}
