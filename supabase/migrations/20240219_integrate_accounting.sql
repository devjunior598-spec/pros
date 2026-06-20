-- Migration: Integrate Accounting into Wallet Payment
-- Description: Updates `process_wallet_payment` to record journal entries.

CREATE OR REPLACE FUNCTION public.process_wallet_payment(
    p_bill_id UUID,
    p_amount NUMERIC,
    p_tenant_id UUID,
    p_reference TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance NUMERIC;
    v_commission NUMERIC;
    v_landlord_amount NUMERIC;
    v_lines JSONB;
    v_entry_id UUID;
    v_tenant_wallet_account UUID;
    v_landlord_wallet_account UUID;
    v_commission_account UUID;
BEGIN
    -- 1. Check Wallet Balance in `wallets` table (Legacy/Read Model)
    SELECT balance INTO v_balance FROM public.wallets WHERE tenant_id = p_tenant_id;
    
    IF v_balance IS NULL THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient wallet balance';
    END IF;

    -- 2. Calculate Commission (Flat 10% for now)
    v_commission := p_amount * 0.10;
    v_landlord_amount := p_amount - v_commission;

    -- 3. Get Account IDs (Caching these or looking them up)
    SELECT id INTO v_tenant_wallet_account FROM public.accounts WHERE code = '2001';
    SELECT id INTO v_landlord_wallet_account FROM public.accounts WHERE code = '2002';
    SELECT id INTO v_commission_account FROM public.accounts WHERE code = '4001';

    IF v_tenant_wallet_account IS NULL OR v_landlord_wallet_account IS NULL OR v_commission_account IS NULL THEN
        RAISE EXCEPTION 'System accounts not configured correctly';
    END IF;

    -- 4. Prepare Journal Lines
    -- Debit Tenant Liability (Reducing Liability = Debit? Wait.)
    -- Liability Normal Balance is Credit.
    -- To decrease Liability, we Debit it. 
    -- Scenario: Tenant has funds (Liability to us). They pay bill. We owe them less. -> Debit Liability. Correct.
    
    -- Credit Landlord Liability (Increasing Liability)
    -- We now owe the Landlord. -> Credit Liability. Correct.
    
    -- Credit Commission Revenue (Increasing Income)
    -- Income Normal Balance is Credit. -> Credit Revenue. Correct.
    
    v_lines := jsonb_build_array(
        jsonb_build_object(
            'account_id', v_tenant_wallet_account,
            'debit', p_amount,
            'credit', 0,
            'description', 'Bill Payment Deduction'
        ),
        jsonb_build_object(
            'account_id', v_landlord_wallet_account,
            'debit', 0,
            'credit', v_landlord_amount,
            'description', 'Bill Payment Credit to Landlord'
        ),
        jsonb_build_object(
            'account_id', v_commission_account,
            'debit', 0,
            'credit', v_commission,
            'description', 'Platform Commission (10%)'
        )
    );

    -- 5. Record Journal Entry (Atomically updates account balances)
    -- This helps audit.
    PERFORM public.record_journal_entry(
        CURRENT_DATE,
        'Bill Payment: ' || p_bill_id,
        v_lines,
        p_bill_id,
        'bill',
        jsonb_build_object('commission', v_commission, 'tenant_id', p_tenant_id)
    );

    -- 6. Update Legacy Tables (Wallets, Transactions, Payments)
    -- Update Tenant Wallet
    UPDATE public.wallets 
    SET balance = balance - p_amount 
    WHERE tenant_id = p_tenant_id;

    -- Record Transaction
    INSERT INTO public.transactions (tenant_id, type, amount, reference, status, description)
    VALUES (p_tenant_id, 'debit', p_amount, p_reference, 'success', 'Bill Payment: ' || p_bill_id);

    -- Record Payment
    INSERT INTO public.payments (bill_id, amount, status, reference, payment_method, currency)
    VALUES (p_bill_id, p_amount, 'success', p_reference, 'wallet', 'NGN');

    -- 6.5. Update Bill Record atomically
    UPDATE public.bills
    SET
        amount_paid = COALESCE(amount_paid, 0) + p_amount,
        status = CASE
            WHEN COALESCE(amount_paid, 0) + p_amount >= amount THEN 'paid'
            ELSE 'partially_paid'
        END,
        paid_at = CASE
            WHEN COALESCE(amount_paid, 0) + p_amount >= amount THEN CURRENT_TIMESTAMP
            ELSE paid_at
        END
    WHERE id = p_bill_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bill not found';
    END IF;

    -- 7. Return Success
    RETURN jsonb_build_object('success', true, 'message', 'Payment successful');

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
