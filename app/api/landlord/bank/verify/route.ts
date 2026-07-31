import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { paystack } from '@/lib/paystack';
import { getCurrentUserWithRole } from '@/lib/supabase-server';

export async function POST(req: Request) {
    try {
        const currentUser = await getCurrentUserWithRole();
        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
        }
        if (currentUser.role !== 'landlord') {
            return NextResponse.json({ success: false, message: 'Only landlords can verify withdrawal bank accounts' }, { status: 403 });
        }

        const { accountNumber, bankCode } = await req.json();

        if (!accountNumber || !bankCode || !/^\d{10}$/.test(accountNumber)) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch landlord's registered name from profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('full_name, name')
            .eq('id', currentUser.user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 });
        }

        // 2. Resolve account name via Paystack
        let resolvedAccount;
        try {
            resolvedAccount = await paystack.resolveAccount(accountNumber, bankCode);
        } catch (err: any) {
            return NextResponse.json({ success: false, message: err.message || 'Failed to resolve bank account' }, { status: 400 });
        }

        const resolvedName = resolvedAccount.account_name.toUpperCase();
        const profileName = (profile.full_name || profile.name || '').toUpperCase();
        if (!profileName) {
            return NextResponse.json({ success: false, message: 'Add your full name before verifying a bank account.' }, { status: 400 });
        }

        // 3. Strict Name Matching Logic
        // We clean up names to handle slight variations in spacing or common titles
        const cleanName = (name: string) => name.replace(/[^A-Z]/g, '').trim();

        const isMatch = cleanName(resolvedName) === cleanName(profileName);

        if (!isMatch) {
            return NextResponse.json({
                success: false,
                message: `Bank account name (${resolvedName}) must match your registered name (${profileName}).`
            }, { status: 400 });
        }

        // 4. Create Transfer Recipient on Paystack
        const recipient = await paystack.createTransferRecipient(profile.full_name || profile.name, accountNumber, bankCode);

        // 5. Save/Update Bank Details in Landlord Wallet
        const { error: walletError } = await supabaseAdmin
            .from('landlord_wallets')
            .update({
                bank_account_number: accountNumber,
                bank_name: resolvedAccount.bank_name || 'Bank', // Note: Paystack resolve might not return bank_name directly, but we can listBanks if needed.
                bank_code: bankCode,
                account_name: resolvedAccount.account_name,
                recipient_code: recipient.recipient_code
            })
            .eq('landlord_id', currentUser.user.id);

        if (walletError) {
            throw walletError;
        }

        return NextResponse.json({
            success: true,
            message: 'Bank account verified and linked successfully',
            data: { accountName: resolvedAccount.account_name }
        });

    } catch (error: any) {
        console.error('Bank Verification Error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const banks = await paystack.listBanks();
        return NextResponse.json({ success: true, data: banks });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: 'Failed to fetch banks' }, { status: 500 });
    }
}
