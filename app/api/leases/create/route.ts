import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getCurrentUserWithRole } from '@/lib/supabase-server';

export async function POST(req: Request) {
    try {
        const currentUser = await getCurrentUserWithRole();
        if (!currentUser) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        if (currentUser.role !== 'landlord') {
            return NextResponse.json({ error: 'Only landlords can create lease agreements' }, { status: 403 });
        }

        const body = await req.json();
        const {
            leaseId,
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

        if (!propertyId || !title || !rentAmount || !startDate || !endDate || !termsAndConditions) {
            return NextResponse.json({ error: 'Missing required lease fields' }, { status: 400 });
        }

        if (Number(rentAmount) <= 0 || new Date(startDate) >= new Date(endDate)) {
            return NextResponse.json({ error: 'Provide a positive rent amount and a valid lease period' }, { status: 400 });
        }

        const { data: property } = await supabaseAdmin
            .from('properties')
            .select('id')
            .eq('id', propertyId)
            .eq('landlord_id', currentUser.user.id)
            .maybeSingle();

        if (!property) {
            return NextResponse.json({ error: 'You can only create leases for your own properties' }, { status: 403 });
        }

        if (tenantId) {
            const { data: rental } = await supabaseAdmin
                .from('rentals')
                .select('id')
                .eq('property_id', propertyId)
                .eq('landlord_id', currentUser.user.id)
                .eq('tenant_id', tenantId)
                .in('status', ['approved', 'active'])
                .maybeSingle();

            if (!rental) {
                return NextResponse.json({ error: 'The selected tenant does not have an approved application for this property' }, { status: 400 });
            }
        }

        // If updating an existing lease, check if signed
        if (leaseId) {
            const { data: existingLease, error: fetchError } = await supabaseAdmin
                .from('lease_agreements')
                .select('status, landlord_id')
                .eq('id', leaseId)
                .maybeSingle();

            if (fetchError || !existingLease) {
                return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
            }

            if (existingLease.status !== 'Draft' && existingLease.status !== 'Sent') {
                return NextResponse.json({ error: 'Signed or locked leases cannot be edited.' }, { status: 400 });
            }
            if (existingLease.landlord_id !== currentUser.user.id) {
                return NextResponse.json({ error: 'You can only edit your own lease agreements' }, { status: 403 });
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
                .eq('landlord_id', currentUser.user.id)
                .select('*')
                .single();

            if (updateError) throw updateError;
            return NextResponse.json({ success: true, lease: updatedLease });
        }

        // Insert new lease agreement (Default status: Draft)
        const { data: newLease, error: insertError } = await supabaseAdmin
            .from('lease_agreements')
            .insert({
                landlord_id: currentUser.user.id,
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
