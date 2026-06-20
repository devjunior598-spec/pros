-- Create Service Providers Table
CREATE TABLE IF NOT EXISTS public.service_providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    website TEXT,
    service_area TEXT NOT NULL,
    description TEXT,
    rating NUMERIC DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    image_url TEXT
);

-- Enable RLS
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for all users" ON public.service_providers FOR SELECT USING (true);


-- Seed Data
INSERT INTO public.service_providers (name, category, phone, whatsapp, service_area, description, is_verified, rating, review_count)
VALUES
    ('FixItAll Handyman Services', 'General Repairs', '+234 800 111 2222', '+234 800 111 2222', 'Lagos', 'Handyman services, home maintenance, general fixing and adjustments.', true, 4.8, 12),
    ('QuickFix Home Solutions', 'General Repairs', '+234 800 111 2233', '+234 800 111 2233', 'Abuja', 'Fast and reliable general repairs for homes and offices.', true, 4.5, 8),

    ('ProFlow Plumbers', 'Plumbing Works', '+234 800 222 3333', '+234 800 222 3333', 'Lagos', 'Fixing leaking taps and pipes, unblocking drains and toilets, toilet repairs and installation.', true, 4.9, 25),
    ('CityWide Plumbing', 'Plumbing Works', '+234 800 222 3344', '+234 800 222 3344', 'Port Harcourt', 'Water heater repair, sink and basin repairs, professional plumbing.', true, 4.6, 15),

    ('SparkBright Electricals', 'Electrical Works', '+234 800 333 4444', '+234 800 333 4444', 'Lagos', 'Fixing faulty sockets and switches, light installation and repairs, wiring and rewiring.', true, 4.7, 30),
    ('PowerMasters', 'Electrical Works', '+234 800 333 4455', '+234 800 333 4455', 'Abuja', 'Circuit breaker repairs, fan installation, comprehensive electrical solutions.', true, 4.8, 18),

    ('SolidBuild Masons', 'Building & Structural Works', '+234 800 444 5555', '+234 800 444 5555', 'Lagos', 'Masonry and brick repairs, wall cracks repair, plastering and rendering.', true, 4.4, 10),
    ('Concrete Experts', 'Building & Structural Works', '+234 800 444 5566', '+234 800 444 5566', 'Kano', 'Concrete repairs, structural reinforcement, heavy duty building works.', true, 4.5, 7),

    ('Rainbow Painters', 'Finishing Works', '+234 800 555 6666', '+234 800 555 6666', 'Lagos', 'Painting (interior & exterior), wall patching, wallpaper installation/removal.', true, 4.9, 40),
    ('Elite Finishes', 'Finishing Works', '+234 800 555 6677', '+234 800 555 6677', 'Abuja', 'Ceiling repairs (POP, gypsum), flawless wall finishing.', true, 4.7, 22),

    ('WoodCraft Masters', 'Carpentry Works', '+234 800 666 7777', '+234 800 666 7777', 'Lagos', 'Door repairs and installation, window repairs, cabinet fixing.', true, 4.6, 14),
    ('Furniture Fixers', 'Carpentry Works', '+234 800 666 7788', '+234 800 666 7788', 'Port Harcourt', 'Furniture repairs, shelves installation, bespoke carpentry.', true, 4.5, 9),

    ('ClearView Glass', 'Glass & Aluminum Works', '+234 800 777 8888', '+234 800 777 8888', 'Lagos', 'Window glass replacement, sliding door repairs, aluminum frame repairs.', true, 4.8, 16),

    ('TilePerfect', 'Tiling & Flooring', '+234 800 888 9999', '+234 800 888 9999', 'Lagos', 'Tile replacement, floor repairs, grouting and regrouting.', true, 4.7, 20),
    ('WoodFloor Pros', 'Tiling & Flooring', '+234 800 888 9900', '+234 800 888 9900', 'Abuja', 'Wooden floor repairs, refinishing, and installation.', false, 4.3, 5),

    ('CoolBreeze AC', 'HVAC / Cooling', '+234 800 999 0000', '+234 800 999 0000', 'Lagos', 'Air conditioner repairs, AC installation, ventilation fixes.', true, 4.8, 35),

    ('SecureLocksmiths', 'Security & Fittings', '+234 800 000 1111', '+234 800 000 1111', 'Lagos', 'Lock repair and replacement, door handle repairs, gate repairs.', true, 4.9, 28),

    ('RoofGuard', 'Exterior & Outdoor', '+234 800 111 0000', '+234 800 111 0000', 'Lagos', 'Roof leak repairs, gutter cleaning and repair, fence repairs.', true, 4.6, 12);

-- Refresh Cache
NOTIFY pgrst, 'reload config';
