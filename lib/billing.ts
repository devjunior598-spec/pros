import { supabaseAdmin } from './supabase-admin';

/**
 * Generates monthly rent bills for all active rentals if they don't already exist for the current month.
 */
export async function generateMonthlyBills() {
    const results = {
        processed: 0,
        created: 0,
        skipped: 0,
        errors: [] as any[]
    };

    try {
        // 1. Fetch all active or approved rentals
        const { data: rentals, error: rentalsError } = await supabaseAdmin
            .from('rentals')
            .select('*, property:properties(title)')
            .in('status', ['active', 'approved']);

        if (rentalsError) throw rentalsError;
        if (!rentals || rentals.length === 0) return results;

        const now = new Date();
        const currentMonth = now.getMonth(); // 0-indexed
        const currentYear = now.getFullYear();

        // Target due date: 5th of the current month
        const dueDate = new Date(currentYear, currentMonth, 5);
        const monthYearStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`;

        for (const rental of rentals) {
            results.processed++;

            // 2. Check if a bill already exists for this rental in the current month
            // We'll check for bills of type 'rent' near this month's due date 
            // OR use metadata if we add it. For now, check due_date range as its simplest.
            const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
            const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();

            const { data: existingBills, error: billCheckError } = await supabaseAdmin
                .from('bills')
                .select('id')
                .eq('rental_id', rental.id)
                .eq('type', 'rent')
                .gte('due_date', startOfMonth)
                .lte('due_date', endOfMonth);

            if (billCheckError) {
                results.errors.push({ rentalId: rental.id, error: billCheckError.message });
                continue;
            }

            if (existingBills && existingBills.length > 0) {
                results.skipped++;
                continue;
            }

            // 3. Create the bill
            const { error: createError } = await supabaseAdmin
                .from('bills')
                .insert({
                    rental_id: rental.id,
                    amount: rental.rent_amount || 0,
                    due_date: dueDate.toISOString(),
                    type: 'rent',
                    status: 'pending',
                    metadata: {
                        month: currentMonth + 1,
                        year: currentYear,
                        generated_at: now.toISOString(),
                        description: `Rent for ${rental.property?.title} - ${monthYearStr}`
                    }
                });

            if (createError) {
                results.errors.push({ rentalId: rental.id, error: createError.message });
            } else {
                results.created++;
            }
        }
    } catch (error: any) {
        console.error("Critical error in bill generation:", error);
        results.errors.push({ critical: error.message });
    }

    return results;
}
