import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getCurrentUserWithRole } from '@/lib/supabase-server';

const allowedDays = new Set(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);

function validTime(value: unknown) {
    return typeof value === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(value);
}

export async function POST(req: Request) {
    try {
        const currentUser = await getCurrentUserWithRole();
        if (!currentUser) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        if (currentUser.role !== 'landlord') {
            return NextResponse.json({ error: 'Only landlords can update availability' }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const { availableDays, startTime, endTime, slotDuration } = body;
        const cleanDays = Array.isArray(availableDays)
            ? availableDays.filter((day): day is string => typeof day === 'string' && allowedDays.has(day))
            : [];
        const duration = Number(slotDuration);

        if (cleanDays.length === 0 || !validTime(startTime) || !validTime(endTime) || !Number.isInteger(duration) || duration < 15 || duration > 240) {
            return NextResponse.json({ error: 'Invalid availability settings' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('landlord_availabilities')
            .upsert({
                landlord_id: currentUser.user.id,
                available_days: cleanDays,
                start_time: startTime,
                end_time: endTime,
                slot_duration: duration
            }, {
                onConflict: 'landlord_id'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, availability: data, message: 'Availability rules updated successfully' });
    } catch (error) {
        console.error('Error updating availability rules:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
