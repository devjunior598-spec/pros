import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { landlordId, availableDays, startTime, endTime, slotDuration } = body;

        if (!landlordId || !availableDays || !startTime || !endTime || !slotDuration) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Upsert landlord availability rules
        const { data, error } = await supabaseAdmin
            .from('landlord_availabilities')
            .upsert({
                landlord_id: landlordId,
                available_days: availableDays,
                start_time: startTime,
                end_time: endTime,
                slot_duration: slotDuration
            }, {
                onConflict: 'landlord_id'
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true, availability: data, message: 'Availability rules updated successfully' });
    } catch (error: any) {
        console.error('Error updating availability rules:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
