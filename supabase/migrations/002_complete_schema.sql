-- ============================================
-- TechRepair SaaS - Complete Database Schema
-- Version 2.0 - With Correct RLS Policies
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Plans (SaaS subscription plans)
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_users INTEGER NOT NULL DEFAULT 3,
  max_clients INTEGER NOT NULL DEFAULT 50,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenants (companies using the SaaS)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'payment_due', 'suspended', 'cancelled')),
  plan_id UUID REFERENCES public.plans(id),
  payment_due_date TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Super Admins (SaaS owners - NOT tied to any tenant)
CREATE TABLE IF NOT EXISTS public.super_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SaaS Payments (subscription payments)
CREATE TABLE IF NOT EXISTS public.saas_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  external_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (employees of tenants)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  auth_user_id UUID NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'technician' CHECK (role IN ('admin', 'technician', 'receptionist')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients (customers of tenants)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  tax_id TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Orders
CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  assigned_to UUID REFERENCES public.users(id),
  order_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_parts', 'completed', 'delivered', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  device_type TEXT,
  device_brand TEXT,
  device_model TEXT,
  device_serial TEXT,
  problem_description TEXT NOT NULL,
  diagnosis TEXT,
  estimated_cost DECIMAL(10,2),
  final_cost DECIMAL(10,2),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, order_number)
);

-- Technical Reports
CREATE TABLE IF NOT EXISTS public.technical_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES public.users(id),
  diagnosis TEXT NOT NULL,
  work_performed TEXT NOT NULL,
  parts_used JSONB DEFAULT '[]',
  recommendations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Categories
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.product_categories(id),
  sku TEXT,
  name TEXT NOT NULL,
  description TEXT,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10,2) DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER DEFAULT 5,
  is_service BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, sku)
);

-- Product Serials
CREATE TABLE IF NOT EXISTS public.product_serials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  serial_number TEXT NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'used_internal', 'defective')),
  work_order_id UUID REFERENCES public.work_orders(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, serial_number)
);

-- Inventory Movements
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  user_id UUID REFERENCES public.users(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'adjustment', 'return', 'internal_use')),
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  work_order_id UUID REFERENCES public.work_orders(id),
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 12.00,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, invoice_number)
);

-- Invoice Lines
CREATE TABLE IF NOT EXISTS public.invoice_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments (client payments for invoices)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  reference TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounting Entries
CREATE TABLE IF NOT EXISTS public.accounting_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_auth ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_clients_tenant ON public.clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_tenant ON public.work_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_client ON public.work_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON public.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

-- ============================================
-- HELPER FUNCTIONS (SECURITY DEFINER - bypass RLS)
-- ============================================

-- Check if current user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin() 
RETURNS BOOLEAN 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM super_admins WHERE user_id = auth.uid()
  );
END;
$$;

-- Get current user's tenant_id
CREATE OR REPLACE FUNCTION public.get_my_tenant_id() 
RETURNS UUID 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid UUID;
BEGIN
  SELECT tenant_id INTO tid FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
  RETURN tid;
END;
$$;

-- Get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role() 
RETURNS TEXT 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r TEXT;
BEGIN
  SELECT role INTO r FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
  RETURN r;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- ============================================
-- ROW LEVEL SECURITY - ENABLE
-- ============================================
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_serials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- ========== PLANS ==========
-- Everyone can read active plans
CREATE POLICY "plans_select_all" ON public.plans 
  FOR SELECT USING (true);

-- Only super admins can manage plans
CREATE POLICY "plans_manage" ON public.plans 
  FOR ALL USING (public.is_super_admin());

-- ========== SUPER_ADMINS ==========
-- Anyone authenticated can check if they're super admin (needed for function)
CREATE POLICY "super_admins_select" ON public.super_admins 
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only super admins can manage super admins
CREATE POLICY "super_admins_manage" ON public.super_admins 
  FOR ALL USING (public.is_super_admin());

-- ========== TENANTS ==========
-- Super admins can do everything
CREATE POLICY "tenants_super" ON public.tenants 
  FOR ALL USING (public.is_super_admin());

-- Authenticated users can create tenants (onboarding)
CREATE POLICY "tenants_insert" ON public.tenants 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can read their own tenant
CREATE POLICY "tenants_select_own" ON public.tenants 
  FOR SELECT USING (id = public.get_my_tenant_id());

-- ========== SAAS_PAYMENTS ==========
-- Super admins can do everything
CREATE POLICY "saas_payments_super" ON public.saas_payments 
  FOR ALL USING (public.is_super_admin());

-- Tenant admins can read their payments
CREATE POLICY "saas_payments_select" ON public.saas_payments 
  FOR SELECT USING (tenant_id = public.get_my_tenant_id() AND public.get_my_role() = 'admin');

-- ========== USERS ==========
-- Super admins can do everything
CREATE POLICY "users_super" ON public.users 
  FOR ALL USING (public.is_super_admin());

-- Authenticated users can create their own user record (onboarding)
CREATE POLICY "users_insert_self" ON public.users 
  FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- Users can read users in their tenant
CREATE POLICY "users_select_tenant" ON public.users 
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

-- Admins can manage users in their tenant
CREATE POLICY "users_manage_admin" ON public.users 
  FOR ALL USING (tenant_id = public.get_my_tenant_id() AND public.get_my_role() = 'admin');

-- ========== CLIENTS ==========
-- Super admins can do everything
CREATE POLICY "clients_super" ON public.clients 
  FOR ALL USING (public.is_super_admin());

-- Users can read clients in their tenant
CREATE POLICY "clients_select_tenant" ON public.clients 
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

-- Admins and receptionists can manage clients
CREATE POLICY "clients_manage" ON public.clients 
  FOR ALL USING (
    tenant_id = public.get_my_tenant_id() 
    AND public.get_my_role() IN ('admin', 'receptionist')
  );

-- ========== WORK_ORDERS ==========
-- Super admins can do everything
CREATE POLICY "work_orders_super" ON public.work_orders 
  FOR ALL USING (public.is_super_admin());

-- Users can read work orders in their tenant
CREATE POLICY "work_orders_select_tenant" ON public.work_orders 
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

-- Admins and receptionists can create/update work orders
CREATE POLICY "work_orders_manage" ON public.work_orders 
  FOR ALL USING (
    tenant_id = public.get_my_tenant_id() 
    AND public.get_my_role() IN ('admin', 'receptionist')
  );

-- Technicians can update work orders assigned to them
CREATE POLICY "work_orders_tech_update" ON public.work_orders 
  FOR UPDATE USING (
    tenant_id = public.get_my_tenant_id() 
    AND assigned_to = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- ========== TECHNICAL_REPORTS ==========
-- Super admins can do everything
CREATE POLICY "reports_super" ON public.technical_reports 
  FOR ALL USING (public.is_super_admin());

-- Users can read reports in their tenant
CREATE POLICY "reports_select_tenant" ON public.technical_reports 
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

-- Technicians can create reports for their work orders
CREATE POLICY "reports_insert_tech" ON public.technical_reports 
  FOR INSERT WITH CHECK (
    tenant_id = public.get_my_tenant_id() 
    AND technician_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- Technicians can update their own reports
CREATE POLICY "reports_update_tech" ON public.technical_reports 
  FOR UPDATE USING (
    tenant_id = public.get_my_tenant_id() 
    AND technician_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- ========== PRODUCT_CATEGORIES ==========
-- Super admins can do everything
CREATE POLICY "categories_super" ON public.product_categories 
  FOR ALL USING (public.is_super_admin());

-- Users can read categories in their tenant
CREATE POLICY "categories_select_tenant" ON public.product_categories 
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

-- Admins can manage categories
CREATE POLICY "categories_manage" ON public.product_categories 
  FOR ALL USING (tenant_id = public.get_my_tenant_id() AND public.get_my_role() = 'admin');

-- ========== PRODUCTS ==========
-- Super admins can do everything
CREATE POLICY "products_super" ON public.products 
  FOR ALL USING (public.is_super_admin());

-- Users can read products in their tenant
CREATE POLICY "products_select_tenant" ON public.products 
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

-- Admins can manage products
CREATE POLICY "products_manage" ON public.products 
  FOR ALL USING (tenant_id = public.get_my_tenant_id() AND public.get_my_role() = 'admin');

-- ========== PRODUCT_SERIALS ==========
-- Super admins can do everything
CREATE POLICY "serials_super" ON public.product_serials 
  FOR ALL USING (public.is_super_admin());

-- Users can read serials in their tenant
CREATE POLICY "serials_select_tenant" ON public.product_serials 
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

-- Admins can manage serials
CREATE POLICY "serials_manage" ON public.product_serials 
  FOR ALL USING (tenant_id = public.get_my_tenant_id() AND public.get_my_role() = 'admin');

-- ========== INVENTORY_MOVEMENTS ==========
-- Super admins can do everything
CREATE POLICY "movements_super" ON public.inventory_movements 
  FOR ALL USING (public.is_super_admin());

-- Users can read movements in their tenant
CREATE POLICY "movements_select_tenant" ON public.inventory_movements 
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

-- Admins can manage movements
CREATE POLICY "movements_manage" ON public.inventory_movements 
  FOR ALL USING (tenant_id = public.get_my_tenant_id() AND public.get_my_role() = 'admin');

-- ========== INVOICES ==========
-- Super admins can do everything
CREATE POLICY "invoices_super" ON public.invoices 
  FOR ALL USING (public.is_super_admin());

-- Users can read invoices in their tenant
CREATE POLICY "invoices_select_tenant" ON public.invoices 
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

-- Admins can manage invoices
CREATE POLICY "invoices_manage" ON public.invoices 
  FOR ALL USING (tenant_id = public.get_my_tenant_id() AND public.get_my_role() = 'admin');

-- ========== INVOICE_LINES ==========
-- Super admins can do everything
CREATE POLICY "invoice_lines_super" ON public.invoice_lines 
  FOR ALL USING (public.is_super_admin());

-- Users can read invoice lines for invoices in their tenant
CREATE POLICY "invoice_lines_select" ON public.invoice_lines 
  FOR SELECT USING (
    invoice_id IN (SELECT id FROM public.invoices WHERE tenant_id = public.get_my_tenant_id())
  );

-- Admins can manage invoice lines
CREATE POLICY "invoice_lines_manage" ON public.invoice_lines 
  FOR ALL USING (
    invoice_id IN (SELECT id FROM public.invoices WHERE tenant_id = public.get_my_tenant_id())
    AND public.get_my_role() = 'admin'
  );

-- ========== PAYMENTS ==========
-- Super admins can do everything
CREATE POLICY "payments_super" ON public.payments 
  FOR ALL USING (public.is_super_admin());

-- Users can read payments in their tenant
CREATE POLICY "payments_select_tenant" ON public.payments 
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

-- Admins can manage payments
CREATE POLICY "payments_manage" ON public.payments 
  FOR ALL USING (tenant_id = public.get_my_tenant_id() AND public.get_my_role() = 'admin');

-- ========== ACCOUNTING_ENTRIES ==========
-- Super admins can do everything
CREATE POLICY "accounting_super" ON public.accounting_entries 
  FOR ALL USING (public.is_super_admin());

-- Admins can read accounting in their tenant
CREATE POLICY "accounting_select" ON public.accounting_entries 
  FOR SELECT USING (tenant_id = public.get_my_tenant_id() AND public.get_my_role() = 'admin');

-- Admins can manage accounting
CREATE POLICY "accounting_manage" ON public.accounting_entries 
  FOR ALL USING (tenant_id = public.get_my_tenant_id() AND public.get_my_role() = 'admin');

-- ============================================
-- SEED DATA
-- ============================================
INSERT INTO public.plans (name, price_monthly, price_yearly, max_users, max_clients, features) VALUES
  ('Starter', 29.00, 290.00, 3, 50, '{"modules": ["clients", "work_orders", "reports"]}'),
  ('Professional', 59.00, 590.00, 10, 200, '{"modules": ["clients", "work_orders", "reports", "inventory", "invoicing"]}'),
  ('Enterprise', 99.00, 990.00, -1, -1, '{"modules": ["clients", "work_orders", "reports", "inventory", "invoicing", "accounting", "api"]}')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- GRANT PERMISSIONS (Required for RLS to work)
-- ============================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT SELECT ON public.plans TO anon;
