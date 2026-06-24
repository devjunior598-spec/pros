import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { propertyId, tenantId, landlordId, amount, reference, dueDate, billId } = body;

        if (!propertyId || !landlordId || !amount || !reference) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Check if reference already used
        const { data: existingPayment } = await supabaseAdmin
            .from('rent_payments')
            .select('id')
            .eq('transaction_reference', reference)
            .maybeSingle();

        if (existingPayment) {
            return NextResponse.json({ error: 'This transaction reference is already in use.' }, { status: 400 });
        }

        // 2. Insert the pending payment log
        const { data: paymentRecord, error: insertError } = await supabaseAdmin
            .from('rent_payments')
            .insert({
                tenant_id: tenantId || null,
                landlord_id: landlordId,
                property_id: propertyId,
                bill_id: billId || null,
                amount: amount,
                payment_method: 'Bank Transfer Reference',
                transaction_reference: reference,
                payment_status: 'Pending',
                due_date: dueDate || null
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // 3. Mark the bill as processing so it blocks other attempts
        if (billId) {
            await supabaseAdmin
                .from('bills')
                .update({ status: 'processing' })
                .eq('id', billId);
        }

        // 4. Notify Landlord
        const { data: propertyData } = await supabaseAdmin
            .from('properties')
            .select('title')
            .eq('id', propertyId)
            .maybeSingle();

        await supabaseAdmin.rpc('create_notification', {
            p_user_id: landlordId,
            p_type: 'bank_transfer_submitted',
            p_title: 'Bank Transfer Submitted',
            p_message: `Tenant submitted a bank transfer of ₦${amount.toLocaleString()} for "${propertyData?.title || 'Property'}" with ref: ${reference}.`,
            p_link: '/dashboard/payments'
        });

        return NextResponse.json({ success: true, paymentRecord });

    } catch (error: any) {
        console.error('Bank transfer submission error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
