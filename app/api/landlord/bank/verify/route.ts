import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { paystack } from '@/lib/paystack';

export async function POST(req: Request) {
    try {
        const { accountNumber, bankCode, userId } = await req.json();

        if (!accountNumber || !bankCode || !userId) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch landlord's registered name from profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', userId)
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
        const profileName = profile.name.toUpperCase();

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
        const recipient = await paystack.createTransferRecipient(profile.name, accountNumber, bankCode);

        // 5. Save/Update Bank Details in Landlord Wallet
        const { error: walletError } = await supabase
            .from('landlord_wallets')
            .update({
                bank_account_number: accountNumber,
                bank_name: resolvedAccount.bank_name || 'Bank', // Note: Paystack resolve might not return bank_name directly, but we can listBanks if needed.
                bank_code: bankCode,
                account_name: resolvedAccount.account_name,
                recipient_code: recipient.recipient_code
            })
            .eq('landlord_id', userId);

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
