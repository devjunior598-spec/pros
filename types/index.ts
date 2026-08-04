export type UserRole = 'tenant' | 'landlord' | 'admin' | 'provider';

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
    is_multi_unit?: boolean;
    shared_amenities?: string[];
    shared_images?: string[];
    latitude?: number;
    longitude?: number;
    property_manager_id?: string;
    country?: string;
    building_rules?: string[];
    parking_details?: string;
    security_details?: string;
    manager_name?: string;
    manager_phone?: string;
    publication_status?: 'draft' | 'published' | 'archived';
}

export type UnitAvailability = 'available' | 'occupied' | 'reserved' | 'maintenance' | 'inactive';
export type PaymentFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'biannually' | 'yearly';

export interface PropertyUnit {
    id: string;
    property_id: string;
    landlord_id: string;
    name: string;
    description?: string;
    bedrooms: number;
    bathrooms: number;
    toilets: number;
    floor?: string;
    size?: number;
    rent: number;
    payment_frequency: PaymentFrequency;
    amenities: string[];
    images: string[];
    availability: UnitAvailability;
    created_at: string;
    updated_at: string;
    deposit?: number;
    meter_number?: string;
    parking_slot?: string;
    balcony?: boolean;
    published?: boolean;
    unit_tenants?: UnitTenant[];
    leases?: UnitLease[];
}

export interface UnitTenant {
    id: string;
    unit_id: string;
    tenant_id: string;
    landlord_id: string;
    occupation?: string;
    move_in_date: string;
    move_out_date?: string;
    rent_due_date?: string;
    status: 'pending' | 'active' | 'notice' | 'moved_out';
    tenant?: Pick<Profile, 'id' | 'name' | 'email' | 'phone'>;
}

export interface UnitLease {
    id: string;
    unit_id: string;
    landlord_id: string;
    tenant_id: string;
    start_date: string;
    end_date: string;
    rent_amount: number;
    payment_frequency: PaymentFrequency;
    status: 'draft' | 'sent' | 'active' | 'expired' | 'terminated' | 'renewed';
    document_url?: string;
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
