-- Create the notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
    ON public.notifications FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" 
    ON public.notifications FOR INSERT 
    WITH CHECK (true); -- Allow backend/triggers to insert

-- Enable realtime broadcasting for this table
alter publication supabase_realtime add table public.notifications;

-- Create index for faster querying by user_id
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);


-- Helper function to create a notification
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_type VARCHAR,
    p_title VARCHAR,
    p_message TEXT,
    p_link VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (p_user_id, p_type, p_title, p_message, p_link)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- TRIGGER: When a new repair_quote is inserted (notify Landlord)
CREATE OR REPLACE FUNCTION notify_landlord_on_quote()
RETURNS TRIGGER AS $$
DECLARE
    v_landlord_id UUID;
    v_property_title VARCHAR;
BEGIN
    -- Only trigger on 'pending' status (new quotes)
    IF NEW.status = 'pending' THEN
        -- Get the landlord ID and property title from the related maintenance request
        SELECT 
            r.landlord_id, 
            p.title
        INTO 
            v_landlord_id, 
            v_property_title
        FROM 
            public.maintenance_requests mr
        JOIN 
            public.rentals r ON mr.rental_id = r.id
        JOIN 
            public.properties p ON r.property_id = p.id
        WHERE 
            mr.id = NEW.request_id;

        IF v_landlord_id IS NOT NULL THEN
            PERFORM create_notification(
                v_landlord_id,
                'quote_submitted',
                'New Quote Received',
                'A service provider has submitted a quote of ₦' || NEW.quoted_price || ' for maintenance on ' || v_property_title || '.',
                '/dashboard/maintenance/' || NEW.request_id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_landlord_on_quote ON public.repair_quotes;
CREATE TRIGGER trigger_notify_landlord_on_quote
    AFTER INSERT ON public.repair_quotes
    FOR EACH ROW
    EXECUTE FUNCTION notify_landlord_on_quote();


-- TRIGGER: When a repair quote status changes to accepted (notify Provider)
CREATE OR REPLACE FUNCTION notify_provider_on_quote_accepted()
RETURNS TRIGGER AS $$
DECLARE
    v_property_title VARCHAR;
BEGIN
    -- Only trigger when status changes from pending to accepted
    IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
         -- Get the property title from the related maintenance request
        SELECT 
            p.title
        INTO 
            v_property_title
        FROM 
            public.maintenance_requests mr
        JOIN 
            public.rentals r ON mr.rental_id = r.id
        JOIN 
            public.properties p ON r.property_id = p.id
        WHERE 
            mr.id = NEW.request_id;

        PERFORM create_notification(
            NEW.provider_id,
            'job_awarded',
            'Job Assignment Won',
            'Your quote for maintenance on ' || COALESCE(v_property_title, 'a property') || ' has been accepted! You can now begin work.',
            '/maintenance/assigned'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_provider_on_quote_accepted ON public.repair_quotes;
CREATE TRIGGER trigger_notify_provider_on_quote_accepted
    AFTER UPDATE ON public.repair_quotes
    FOR EACH ROW
    EXECUTE FUNCTION notify_provider_on_quote_accepted();


-- TRIGGER: When a new bill is generated (notify Tenant)
CREATE OR REPLACE FUNCTION notify_tenant_on_new_bill()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get the tenant ID from the related rental
    SELECT tenant_id INTO v_tenant_id
    FROM public.rentals
    WHERE id = NEW.rental_id;

    IF v_tenant_id IS NOT NULL THEN
        PERFORM create_notification(
            v_tenant_id,
            'bill_due',
            'New ' || INITCAP(NEW.type) || ' Bill Created',
            'A new bill for ₦' || NEW.amount || ' has been generated. Due date is ' || TO_CHAR(NEW.due_date, 'Mon DD, YYYY') || '.',
            '/pay-bills'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_tenant_on_new_bill ON public.bills;
CREATE TRIGGER trigger_notify_tenant_on_new_bill
    AFTER INSERT ON public.bills
    FOR EACH ROW
    EXECUTE FUNCTION notify_tenant_on_new_bill();
