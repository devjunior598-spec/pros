import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, action, notes, newDate, newTime, initiator } = body;

        if (!id || !action) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // 1. Fetch the existing booking
        const { data: booking, error: fetchError } = await supabaseAdmin
            .from('inspection_bookings')
            .select(`*, property:properties (title)`)
            .eq('id', id)
            .single();

        if (fetchError || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 44 });
        }

        let updatedStatus = booking.status;
        let updatePayload: any = {};

        if (action === 'approve') {
            updatedStatus = 'approved';
            updatePayload = { status: updatedStatus, notes: notes || null };

            // Notify Tenant
            if (booking.tenant_id) {
                await supabaseAdmin.rpc('create_notification', {
                    p_user_id: booking.tenant_id,
                    p_type: 'inspection_approved',
                    p_title: 'Viewing Approved',
                    p_message: `Your viewing request for "${booking.property?.title}" on ${booking.inspection_date} at ${booking.inspection_time.substring(0,5)} has been approved.`,
                    p_link: '/dashboard/inspections'
                });
            }
        } 
        else if (action === 'reject') {
            updatedStatus = 'rejected';
            updatePayload = { status: updatedStatus, notes: notes || null };

            // Notify Tenant
            if (booking.tenant_id) {
                await supabaseAdmin.rpc('create_notification', {
                    p_user_id: booking.tenant_id,
                    p_type: 'inspection_rejected',
                    p_title: 'Viewing Declined',
                    p_message: `Your viewing request for "${booking.property?.title}" on ${booking.inspection_date} was declined. ${notes ? 'Reason: ' + notes : ''}`,
                    p_link: '/dashboard/inspections'
                });
            }
        } 
        else if (action === 'complete') {
            updatedStatus = 'completed';
            updatePayload = { status: updatedStatus };
        } 
        else if (action === 'cancel') {
            updatedStatus = 'cancelled';
            updatePayload = { status: updatedStatus };

            // Notify counterpart
            const notifyId = initiator === 'landlord' ? booking.tenant_id : booking.landlord_id;
            const roleName = initiator === 'landlord' ? 'Landlord' : 'Tenant';
            
            if (notifyId) {
                await supabaseAdmin.rpc('create_notification', {
                    p_user_id: notifyId,
                    p_type: 'inspection_cancelled',
                    p_title: 'Viewing Cancelled',
                    p_message: `The viewing for "${booking.property?.title}" on ${booking.inspection_date} was cancelled by the ${roleName.toLowerCase()}.`,
                    p_link: '/dashboard/inspections'
                });
            }
        } 
        else if (action === 'reschedule') {
            if (!newDate || !newTime) {
                return NextResponse.json({ error: 'New date and time required for rescheduling' }, { status: 400 });
            }

            // Check if slot is taken first
            const { data: conflicts } = await supabaseAdmin
                .from('inspection_bookings')
                .select('id')
                .eq('landlord_id', booking.landlord_id)
                .eq('inspection_date', newDate)
                .eq('inspection_time', newTime)
                .neq('id', id)
                .in('status', ['pending', 'approved']);

            if (conflicts && conflicts.length > 0) {
                return NextResponse.json({ error: 'This slots is already booked' }, { status: 400 });
            }

            updatedStatus = 'pending'; // Reset status to pending when rescheduled
            updatePayload = {
                inspection_date: newDate,
                inspection_time: newTime,
                status: updatedStatus,
                notes: notes ? `Rescheduled: ${notes}` : booking.notes
            };

            // Notify counterpart
            if (initiator === 'landlord') {
                if (booking.tenant_id) {
                    await supabaseAdmin.rpc('create_notification', {
                        p_user_id: booking.tenant_id,
                        p_type: 'inspection_rescheduled',
                        p_title: 'Viewing Rescheduled',
                        p_message: `Landlord rescheduled the viewing for "${booking.property?.title}" to ${newDate} at ${newTime.substring(0,5)}.`,
                        p_link: '/dashboard/inspections'
                    });
                }
            } else {
                await supabaseAdmin.rpc('create_notification', {
                    p_user_id: booking.landlord_id,
                    p_type: 'inspection_rescheduled',
                    p_title: 'Viewing Reschedule Request',
                    p_message: `Tenant requested to reschedule the viewing for "${booking.property?.title}" to ${newDate} at ${newTime.substring(0,5)}.`,
                    p_link: '/dashboard/inspections'
                });
            }
        }

        // 2. Perform database update
        const { data: updatedBooking, error: updateError } = await supabaseAdmin
            .from('inspection_bookings')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true, booking: updatedBooking, message: `Booking successfully processed` });
    } catch (error: any) {
        console.error('Error processing booking status:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
