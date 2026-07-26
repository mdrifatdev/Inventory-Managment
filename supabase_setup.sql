-- ──── SUPABASE DATABASE SETUP SCRIPT ────
-- Run this in your Supabase SQL Editor to create the necessary tables and policies.

-- 1. Create 'products' table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    "minThreshold" INTEGER NOT NULL DEFAULT 10,
    image_url TEXT,
    brand TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    "isUsed" BOOLEAN DEFAULT FALSE,
    "addedAt" TIMESTAMPTZ DEFAULT NOW(),
    "usedAt" TIMESTAMPTZ
);

-- 2. Create 'inventory_logs' table
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id TEXT PRIMARY KEY,
    "productId" TEXT REFERENCES public.products(id) ON DELETE CASCADE,
    "productName" TEXT NOT NULL,
    type TEXT NOT NULL,
    "quantityChange" INTEGER NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Allowing all operations for authenticated users)
-- NOTE: For production, you should restrict these to specific user IDs.

-- Products Policies
CREATE POLICY "Enable all for authenticated users" ON public.products
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read for anonymous users" ON public.products
    FOR SELECT USING (auth.role() = 'anon');

-- Inventory Logs Policies
CREATE POLICY "Enable all for authenticated users" ON public.inventory_logs
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read for anonymous users" ON public.inventory_logs
    FOR SELECT USING (auth.role() = 'anon');

-- 5. Helper function for updating 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
