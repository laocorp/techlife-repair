-- =============================================
-- CREATE SUPER ADMIN USER
-- =============================================
-- Run this in Supabase SQL Editor
-- Replace the email and password with your desired credentials

-- Step 1: Create auth user via Supabase Dashboard first
-- Go to Authentication > Users > Add User

-- Step 2: After creating the user, run this SQL to mark them as super admin
-- Replace 'superadmin@repairapp.ec' with your actual email

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{is_super_admin}', 
  'true'
)
WHERE email = 'superadmin@repairapp.ec';

-- Verify the update
SELECT 
  id,
  email, 
  raw_user_meta_data->>'is_super_admin' as is_super_admin,
  created_at
FROM auth.users 
WHERE email = 'superadmin@repairapp.ec';

-- =============================================
-- ALTERNATIVE: If you want to invite via email
-- =============================================
-- You can also use Supabase Edge Functions to create users
-- or use the supabase.auth.admin.createUser() API

-- Example using Supabase Admin API (run from server/edge function):
-- const { data, error } = await supabase.auth.admin.createUser({
--   email: 'superadmin@repairapp.ec',
--   password: 'your-secure-password',
--   user_metadata: { is_super_admin: true },
--   email_confirm: true
-- })
