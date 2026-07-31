CREATE OR REPLACE FUNCTION public.notify_conversation_participant_on_message()
RETURNS TRIGGER AS $$
DECLARE
    v_recipient_id UUID;
    v_sender_name TEXT;
    v_property_title TEXT;
    v_preview TEXT;
BEGIN
    SELECT
        CASE WHEN NEW.sender_id = c.landlord_id THEN c.tenant_id ELSE c.landlord_id END,
        COALESCE(p.full_name, p.name, 'Someone'),
        property.title
    INTO v_recipient_id, v_sender_name, v_property_title
    FROM public.conversations c
    LEFT JOIN public.profiles p ON p.id = NEW.sender_id
    LEFT JOIN public.rentals rental ON rental.id = c.rental_id
    LEFT JOIN public.properties property ON property.id = rental.property_id
    WHERE c.id = NEW.conversation_id
      AND NEW.sender_id IN (c.landlord_id, c.tenant_id);

    IF v_recipient_id IS NULL OR NEW.type = 'system' THEN
        RETURN NEW;
    END IF;

    v_preview := CASE
        WHEN NEW.type = 'image' THEN 'Sent you an image'
        WHEN NEW.type = 'file' THEN 'Sent you a file: ' || LEFT(NEW.message, 80)
        ELSE LEFT(NEW.message, 120)
    END;

    PERFORM public.create_notification(
        v_recipient_id,
        'new_message',
        'New message from ' || v_sender_name,
        v_preview || CASE WHEN v_property_title IS NOT NULL THEN ' · ' || v_property_title ELSE '' END,
        '/messages?convId=' || NEW.conversation_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_notify_conversation_participant_on_message ON public.messages;
CREATE TRIGGER trigger_notify_conversation_participant_on_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_conversation_participant_on_message();

NOTIFY pgrst, 'reload schema';
