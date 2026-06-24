import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            leaseId,
            landlordId,
            tenantId,
            propertyId,
            templateType,
            title,
            rentAmount,
            paymentFrequency,
            securityDeposit,
            startDate,
            endDate,
            houseRules,
            termsAndConditions
        } = body;

        if (!landlordId || !propertyId || !title || !rentAmount || !startDate || !endDate || !termsAndConditions) {
            return NextResponse.json({ error: 'Missing required lease fields' }, { status: 400 });
        }

        // If updating an existing lease, check if signed
        if (leaseId) {
            const { data: existingLease, error: fetchError } = await supabaseAdmin
                .from('lease_agreements')
                .select('status')
                .eq('id', leaseId)
                .maybeSingle();

            if (fetchError || !existingLease) {
                return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
            }

            if (existingLease.status !== 'Draft' && existingLease.status !== 'Sent') {
                return NextResponse.json({ error: 'Signed or locked leases cannot be edited.' }, { status: 400 });
            }

            // Update lease agreement
            const { data: updatedLease, error: updateError } = await supabaseAdmin
                .from('lease_agreements')
                .update({
                    tenant_id: tenantId || null,
                    property_id: propertyId,
                    template_type: templateType || 'residential',
                    title,
                    rent_amount: rentAmount,
                    payment_frequency: paymentFrequency || 'monthly',
                    security_deposit: securityDeposit || 0,
                    start_date: startDate,
                    end_date: endDate,
                    house_rules: houseRules || [],
                    terms_and_conditions: termsAndConditions,
                    updated_at: new Date().toISOString()
                })
                .eq('id', leaseId)
                .select('*')
                .single();

            if (updateError) throw updateError;
            return NextResponse.json({ success: true, lease: updatedLease });
        }

        // Insert new lease agreement (Default status: Draft)
        const { data: newLease, error: insertError } = await supabaseAdmin
            .from('lease_agreements')
            .insert({
                landlord_id: landlordId,
                tenant_id: tenantId || null,
                property_id: propertyId,
                template_type: templateType || 'residential',
                title,
                rent_amount: rentAmount,
                payment_frequency: paymentFrequency || 'monthly',
                security_deposit: securityDeposit || 0,
                start_date: startDate,
                end_date: endDate,
                house_rules: houseRules || [],
                terms_and_conditions: termsAndConditions,
                status: 'Draft'
            })
            .select('*')
            .single();

        if (insertError) throw insertError;
        return NextResponse.json({ success: true, lease: newLease });

    } catch (error: any) {
        console.error('Lease creation API error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
