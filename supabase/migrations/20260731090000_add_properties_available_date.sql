-- Keep property creation and "available now" listing filters aligned with production.
ALTER TABLE public.properties
    ADD COLUMN IF NOT EXISTS available_date DATE;

CREATE INDEX IF NOT EXISTS idx_properties_available_date
    ON public.properties (available_date);

NOTIFY pgrst, 'reload config';
