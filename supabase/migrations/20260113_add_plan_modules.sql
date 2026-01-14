-- Add max_clients and max_work_orders columns to plans table
-- Update features JSONB to have structured modules

ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS max_clients INTEGER,
ADD COLUMN IF NOT EXISTS max_work_orders INTEGER;

-- Update existing plans to have max_clients if they don't
UPDATE plans SET max_clients = 50 WHERE max_clients IS NULL AND name LIKE '%Starter%';
UPDATE plans SET max_clients = 200 WHERE max_clients IS NULL AND name LIKE '%Professional%';
UPDATE plans SET max_clients = -1 WHERE max_clients IS NULL AND name LIKE '%Enterprise%';

-- Update existing plans to have max_work_orders if theya don't  
UPDATE plans SET max_work_orders = 100 WHERE max_work_orders IS NULL AND name LIKE '%Starter%';
UPDATE plans SET max_work_orders = 500 WHERE max_work_orders IS NULL AND name LIKE '%Professional%';
UPDATE plans SET max_work_orders = -1 WHERE max_work_orders IS NULL AND name LIKE '%Enterprise%';

-- Set default modules structure for existing plans if features is null or empty
UPDATE plans 
SET features = jsonb_build_object(
  'modules', ARRAY['clients', 'work_orders', 'reports']::text[]
)
WHERE features IS NULL OR features = '{}'::jsonb;

-- Comment: Structure of features JSONB should be:
-- {
--   "modules": ["clients", "work_orders", "reports", "inventory", "invoices", "accounting"]
-- }
