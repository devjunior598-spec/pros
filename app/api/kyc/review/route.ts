import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const { kycId, tenantId, status, rejectionReason, adminId } = await req.json();

        if (!kycId || !tenantId || !status) {
            return NextResponse.json({ message: 'Missing required data' }, { status: 400 });
        }

        // 1. Update KYC Record
        const { error: kycError } = await supabaseAdmin
            .from('tenant_kyc')
            .update({
                status: status,
                rejection_reason: rejectionReason || null,
                reviewed_by: adminId,
                updated_at: new Date().toISOString()
            })
            .eq('id', kycId);

        if (kycError) throw kycError;

        // 2. Update Profile Status
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                is_verified: status === 'approved',
                verification_status: status
            })
            .eq('id', tenantId);

        if (profileError) throw profileError;

        // 3. If approved, trigger wallet generation
        if (status === 'approved') {
            try {
                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('email, name')
                    .eq('id', tenantId)
                    .single();

                if (profile) {
                    const nameParts = profile.name.split(' ');
                    const firstName = nameParts[0];
                    const lastName = nameParts.slice(1).join(' ') || 'User';

                    // Call the internal wallet creation logic
                    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/wallet/create`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: tenantId,
                            email: profile.email,
                            firstName,
                            lastName
                        })
                    });
                }
            } catch (walletError) {
                console.error("Auto-wallet creation failed:", walletError);
                // We don't fail the whole request since KYC is already approved
            }
        }

        return NextResponse.json({ success: true, message: `KYC ${status} successfully` });
    } catch (error: any) {
        console.error('KYC Review Error:', error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
