export type UserRole = 'tenant' | 'landlord';

export interface Profile {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    dashboard_unlocked: boolean;
    created_at: string;
}

export type PropertyStatus = 'available' | 'pending' | 'rented';

export interface Property {
    id: string;
    landlord_id: string;
    title: string;
    price: number;
    address?: string;
    city: string;
    state?: string;
    zip_code?: string;
    area: string;
    type: string;
    description?: string;
    bedrooms?: number;
    bathrooms?: number;
    toilets?: number;
    size?: number;
    square_footage?: number;
    frequency?: string;
    verification_status?: 'pending' | 'approved' | 'rejected';
    updated_at?: string;
    amenities?: string[]; // Array of strings for amenities
    images: string[];
    status: PropertyStatus;
    current_tenant_id?: string;
    created_at: string;
}

export type RentalStatus = 'pending' | 'approved' | 'rejected';

export interface Rental {
    id: string;
    property_id: string;
    tenant_id: string;
    landlord_id: string;
    rent_start_date?: string;
    rent_amount: number;
    status: RentalStatus;
    created_at: string;
}

export type BillType = 'rent' | 'electricity' | 'water' | 'service' | 'custom' | 'light' | 'gas' | 'waste';
export type BillStatus = 'pending' | 'paid' | 'overdue' | 'partially_paid' | 'processing' | 'failed' | 'unpaid'; // 'unpaid' for legacy support

export interface Bill {
    id: string;
    rental_id: string;
    type: BillType;
    amount: number;
    amount_paid: number;
    due_date: string;
    status: BillStatus;
    created_at: string;
    description?: string;
    billing_period?: string; // e.g. "January 2024"
}

export interface LateFee {
    id: string;
    bill_id: string;
    amount: number;
    status: 'active' | 'waived' | 'paid';
    created_at: string;
}

export interface PaymentTransaction {
    id: string;
    bill_id: string;
    amount: number;
    status: 'success' | 'failed' | 'pending';
    reference: string;
    payment_method: string;
    created_at: string;
}



// --- Accounting System Types ---

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface Account {
    id: string;
    code: string;
    name: string;
    type: AccountType;
    description?: string;
    balance: number;
    is_system: boolean;
    currency: string;
    created_at: string;
}

export interface JournalEntry {
    id: string;
    date: string;
    description: string;
    reference_id?: string;
    reference_type?: string;
    metadata?: Record<string, any>;
    lines?: JournalLine[];
    created_at: string;
}

export interface JournalLine {
    id: string;
    entry_id: string;
    account_id: string;
    debit: number;
    credit: number;
    description?: string;
    account?: Account; // Joined
}
