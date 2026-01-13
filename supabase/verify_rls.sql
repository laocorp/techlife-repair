-- =====================================================
-- TechRepair SaaS - RLS Verification Script
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. VERIFY RLS IS ENABLED ON ALL TABLES
-- =====================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'tenants', 'users', 'clients', 'work_orders', 'technical_reports',
    'product_categories', 'products', 'inventory_movements',
    'invoices', 'invoice_lines', 'payments', 'plans'
  )
ORDER BY tablename;

-- Expected: All should show "true" for RLS Enabled (except plans which is public)


-- 2. LIST ALL RLS POLICIES
-- =====================================================
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  SUBSTRING(qual::text, 1, 100) as "Policy Condition (truncated)"
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


-- 3. VERIFY HELPER FUNCTIONS EXIST
-- =====================================================
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('is_super_admin', 'get_my_tenant_id', 'get_my_role');

-- Expected: 3 functions with security_type = 'DEFINER'


-- 4. TEST TENANT ISOLATION (requires actual data)
-- =====================================================
-- Replace 'YOUR_USER_ID' with an actual auth user ID from auth.users

-- Get current user's tenant
-- SELECT get_my_tenant_id();

-- This should only return data from your tenant:
-- SELECT COUNT(*) FROM clients;
-- SELECT COUNT(*) FROM work_orders;
-- SELECT COUNT(*) FROM invoices;


-- 5. VERIFY GRANTS ARE IN PLACE
-- =====================================================
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public'
  AND grantee IN ('authenticated', 'anon')
  AND table_name IN ('tenants', 'users', 'clients', 'work_orders', 'invoices', 'products', 'payments')
ORDER BY table_name, grantee;

-- Expected: authenticated should have SELECT, INSERT, UPDATE, DELETE on most tables


-- 6. CHECK TABLE STRUCTURE (key columns for RLS)
-- =====================================================
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'tenant_id'
ORDER BY table_name;

-- Expected: All main tables should have tenant_id column


-- 7. COUNT POLICIES PER TABLE
-- =====================================================
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Each table should have at least 1-2 policies


-- =====================================================
-- END OF VERIFICATION SCRIPT
-- =====================================================
