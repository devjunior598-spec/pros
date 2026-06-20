export type MaintenanceStatus =
    | 'pending'
    | 'reviewed'
    | 'awaiting_provider_acceptance'
    | 'assigned'
    | 'in_progress'
    | 'awaiting_landlord_confirmation'
    | 'completed'
    | 'reopened'
    | 'closed'
    | 'cancelled';

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'emergency';

export interface MaintenanceRequest {
    id: string;
    created_at: string;
    updated_at: string;
    rental_id: string;
    tenant_id: string;
    property_id?: string;
    title: string;
    description: string;
    status: MaintenanceStatus;
    priority: MaintenancePriority;
    category?: string;
    estimated_cost?: number;
    final_cost?: number;
    images?: any[];

    // Workflow timestamps
    provider_accepted_at?: string;
    work_started_at?: string;
    work_completed_at?: string;
    landlord_confirmed_at?: string;
    rejection_reason?: string;
    proof_of_work_images?: string[];

    // Relationships
    property?: {
        id: string;
        title: string;
        address: string;
    };
    tenant?: {
        name: string;
        email?: string;
    };
    assignments?: RepairAssignment[];
}

export interface ServiceProvider {
    id: string;
    user_id: string;
    experience_years?: number;
    category: string;
    location_city: string;
    location_state: string;
    bio?: string;
    rating: number;
    total_jobs_completed: number;
    verified: boolean;
    approval_status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    provider?: {
        name: string;
        full_name?: string;
        email?: string;
        phone?: string;
    };
}

export interface RepairAssignment {
    id: string;
    request_id: string;
    provider_id: string;
    landlord_id: string;
    status: 'assigned' | 'in_progress' | 'completed';
    cost_estimate?: number;
    created_at: string;
    provider?: ServiceProvider;
}
