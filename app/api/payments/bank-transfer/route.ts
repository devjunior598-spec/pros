import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getCurrentUserWithRole } from '@/lib/supabase-server';

export async function POST(req: Request) {
    try {
        const currentUser = await getCurrentUserWithRole();
        if (!currentUser) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        if (currentUser.role !== 'tenant') {
            return NextResponse.json({ error: 'Only tenants can submit bank transfer references' }, { status: 403 });
        }

        const body = await req.json();
        const { amount, reference, billId } = body;
        const paymentAmount = Number(amount);

        if (!billId || !reference || !Number.isFinite(paymentAmount) || paymentAmount <= 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data: bill } = await supabaseAdmin
            .from('bills')
            .select('id, amount, amount_paid, due_date, status, rental:rentals!inner(tenant_id, landlord_id, property_id)')
            .eq('id', billId)
            .maybeSingle();

        if (!bill) {
            return NextResponse.json({ error: 'You can only submit payments for your own bills' }, { status: 403 });
        }

        const rentalData = bill.rental as any;
        const rental = Array.isArray(rentalData) ? rentalData[0] : rentalData;

        if (!rental || rental.tenant_id !== currentUser.user.id) {
            return NextResponse.json({ error: 'You can only submit payments for your own bills' }, { status: 403 });
        }

        const outstandingAmount = Number(bill.amount) - Number(bill.amount_paid || 0);
        if (paymentAmount > outstandingAmount || bill.status === 'paid') {
            return NextResponse.json({ error: 'Payment amount exceeds the outstanding bill balance' }, { status: 400 });
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
                tenant_id: currentUser.user.id,
                landlord_id: rental.landlord_id,
                property_id: rental.property_id,
                bill_id: bill.id,
                amount: paymentAmount,
                payment_method: 'Bank Transfer Reference',
                transaction_reference: reference,
                payment_status: 'Pending',
                due_date: bill.due_date || null
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
            .eq('id', rental.property_id)
            .maybeSingle();

        await supabaseAdmin.rpc('create_notification', {
            p_user_id: rental.landlord_id,
            p_type: 'bank_transfer_submitted',
            p_title: 'Bank Transfer Submitted',
            p_message: `Tenant submitted a bank transfer of ₦${paymentAmount.toLocaleString()} for "${propertyData?.title || 'Property'}" with ref: ${reference}.`,
            p_link: '/dashboard/payments'
        });

        return NextResponse.json({ success: true, paymentRecord });

    } catch (error: any) {
        console.error('Bank transfer submission error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
