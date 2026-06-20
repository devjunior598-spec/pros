-- Migration: Add Landlord Withdrawals and Balance Management

-- 1. Add balance to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0;

-- 2. Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    landlord_id UUID REFERENCES profiles(id) NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- 3. Enable RLS on withdrawals
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for withdrawals
DROP POLICY IF EXISTS "landlords can view own withdrawals" ON withdrawals;
CREATE POLICY "landlords can view own withdrawals" ON withdrawals
    FOR SELECT USING (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "landlords can request withdrawals" ON withdrawals;
CREATE POLICY "landlords can request withdrawals" ON withdrawals
    FOR INSERT WITH CHECK (auth.uid() = landlord_id);

-- 5. Trigger to update landlord balance when a bill is paid
CREATE OR REPLACE FUNCTION update_landlord_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_landlord_id UUID;
BEGIN
    IF (NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid')) THEN
        -- Find the landlord for this rental
        SELECT landlord_id INTO v_landlord_id FROM rentals WHERE id = NEW.rental_id;
        
        IF v_landlord_id IS NOT NULL THEN
            UPDATE profiles
            SET balance = balance + NEW.amount
            WHERE id = v_landlord_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_bill_paid ON bills;
CREATE TRIGGER on_bill_paid
    AFTER UPDATE ON bills
    FOR EACH ROW
    EXECUTE PROCEDURE update_landlord_balance();

-- 6. Trigger to deduct balance when withdrawal is approved
CREATE OR REPLACE FUNCTION handle_withdrawal_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only deduct if transitioning from pending to approved
    IF (NEW.status = 'approved' AND OLD.status = 'pending') THEN
        UPDATE profiles
        SET balance = balance - NEW.amount
        WHERE id = NEW.landlord_id;
    END IF;
    
    -- Note: If we want to support 'rejection' restoring balance, 
    -- we'd need to deduct ON REQUEST and restore ON REJECTION.
    -- For now, we deduct ONLY ON APPROVAL to keep it simple and safe.
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_withdrawal_status_change ON withdrawals;
CREATE TRIGGER on_withdrawal_status_change
    AFTER UPDATE ON withdrawals
    FOR EACH ROW
    EXECUTE PROCEDURE handle_withdrawal_status_change();
