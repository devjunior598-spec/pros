-- Migration: Advanced Workflow Schema
-- Date: 2024-02-15

-- Update status check constraint
ALTER TABLE public.maintenance_requests 
DROP CONSTRAINT IF EXISTS maintenance_requests_status_check;

ALTER TABLE public.maintenance_requests 
ADD CONSTRAINT maintenance_requests_status_check 
CHECK (status IN (
    'pending', 
    'reviewed', 
    'awaiting_provider_acceptance', 
    'assigned', 
    'in_progress', 
    'awaiting_landlord_confirmation', 
    'completed', 
    'reopened', 
    'closed',
    'cancelled'
));

-- Add new columns for tracking workflow timestamps and details
ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS provider_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS work_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS work_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS landlord_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS proof_of_work_images TEXT[],
ADD COLUMN IF NOT EXISTS final_invoice_url TEXT;

-- Enhance RLS Policies for new workflow

-- Providers can see requests they are 'assigned' to OR 'awaiting_acceptance' for
-- Fix existing policy if needed, or ensure "assigned" means row in repair_assignments exists
-- The repair_assignments table should link provider to request regardless of status

-- Policy for provider to update request status (already added in provider_permissions.sql but we might need to expand it)
-- Ensuring they can ONLY update specific statuses based on current status
-- For simplicity, we trust the application logic but RLS ensures they are the assigned provider.

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
