-- =====================================================
-- TechRepair - Fix Missing Columns
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add payment_date column to payments if missing
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_date DATE DEFAULT CURRENT_DATE;

-- Update existing payments with created_at date
UPDATE payments 
SET payment_date = DATE(created_at) 
WHERE payment_date IS NULL;

-- Confirm
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payments';
