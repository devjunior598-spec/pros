-- Migration: Allow batch payments by making bill_id nullable
-- Date: 2024-02-13

-- Make bill_id nullable
ALTER TABLE public.payments ALTER COLUMN bill_id DROP NOT NULL;

-- Update RLS for tenants to allow viewing batch payments
DROP POLICY IF EXISTS "Tenants can view their own payments" ON public.payments;
CREATE POLICY "Tenants can view their own payments" ON public.payments FOR SELECT USING (
    (bill_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.bills
        JOIN public.rentals ON rentals.id = bills.rental_id
        WHERE bills.id = payments.bill_id AND rentals.tenant_id = auth.uid()
    ))
    OR
    (bill_id IS NULL AND (metadata->>'tenant_id')::uuid = auth.uid())
);

-- Update RLS for landlords to allow viewing batch payments
DROP POLICY IF EXISTS "Landlords can view payments for their properties" ON public.payments;
CREATE POLICY "Landlords can view payments for their properties" ON public.payments FOR SELECT USING (
    (bill_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.bills
        JOIN public.rentals ON rentals.id = bills.rental_id
        JOIN public.properties ON properties.id = rentals.property_id
        WHERE bills.id = payments.bill_id AND properties.landlord_id = auth.uid()
    ))
    OR
    (bill_id IS NULL AND EXISTS (
        -- For batch payments, check if any of the bill_ids in metadata belong to a property owned by the landlord
        -- This is a bit complex for a select policy, but metadata->'bill_ids' should contain the array.
        -- We'll check if the landlord owns at least one property involved in the bills (simplified for now to match tenant logic if possible, or use a lateral join)
        -- Since we have landlord_id in property, and property_id in rental, and rental_id in bills...
        EXISTS (
            SELECT 1 
            FROM jsonb_array_elements_text(metadata->'bill_ids') AS b_id
            JOIN public.bills b ON b.id = b_id::uuid
            JOIN public.rentals r ON r.id = b.rental_id
            JOIN public.properties p ON p.id = r.property_id
            WHERE p.landlord_id = auth.uid()
        )
    ))
);
