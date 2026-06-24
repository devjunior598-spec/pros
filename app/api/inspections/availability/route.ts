import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get('propertyId');
        const dateStr = searchParams.get('date'); // YYYY-MM-DD

        if (!propertyId || !dateStr) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // 1. Fetch property to identify the landlord
        const { data: property, error: propError } = await supabaseAdmin
            .from('properties')
            .select('landlord_id')
            .eq('id', propertyId)
            .single();

        if (propError || !property) {
            return NextResponse.json({ error: 'Property not found' }, { status: 44 });
        }

        const landlordId = property.landlord_id;

        // 2. Fetch landlord availability settings
        let { data: availability, error: availError } = await supabaseAdmin
            .from('landlord_availabilities')
            .select('*')
            .eq('landlord_id', landlordId)
            .maybeSingle();

        // Default availability if not configured in DB
        const defaultDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const defaultStart = '09:00:00';
        const defaultEnd = '17:00:00';
        const defaultDuration = 30; // minutes

        const availableDays = availability?.available_days || defaultDays;
        const startTime = availability?.start_time || defaultStart;
        const endTime = availability?.end_time || defaultEnd;
        const slotDuration = availability?.slot_duration || defaultDuration;

        // 3. Determine the day of the week for the target date
        const targetDate = new Date(dateStr);
        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const targetDay = weekdays[targetDate.getDay()];

        // If the landlord does not work on this weekday, return empty slots list
        if (!availableDays.includes(targetDay)) {
            return NextResponse.json({ slots: [] });
        }

        // 4. Generate all possible timeslots for this day
        const slots: string[] = [];
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);

        let current = new Date();
        current.setHours(startHours, startMinutes, 0, 0);

        const endLimit = new Date();
        endLimit.setHours(endHours, endMinutes, 0, 0);

        while (current < endLimit) {
            const timeString = current.toTimeString().split(' ')[0].substring(0, 5); // "HH:MM"
            slots.push(timeString);
            current.setMinutes(current.getMinutes() + slotDuration);
        }

        // 5. Fetch all active/pending bookings for this landlord on this date
        const { data: bookings, error: bookingsError } = await supabaseAdmin
            .from('inspection_bookings')
            .select('inspection_time')
            .eq('landlord_id', landlordId)
            .eq('inspection_date', dateStr)
            .in('status', ['pending', 'approved']);

        if (bookingsError) {
            console.error('Error fetching existing bookings:', bookingsError);
        }

        // Extract booked times formatted to "HH:MM"
        const bookedTimes = new Set(
            (bookings || []).map(b => b.inspection_time.substring(0, 5))
        );

        // 6. Filter slots: remove booked timeslots
        const availableSlots = slots.filter(slot => !bookedTimes.has(slot));

        return NextResponse.json({ slots: availableSlots });
    } catch (error: any) {
        console.error('Error generating availability slots:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
