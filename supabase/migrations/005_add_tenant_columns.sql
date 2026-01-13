-- =====================================================
-- Add missing columns to tenants table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add company details columns
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenants'
ORDER BY ordinal_position;
