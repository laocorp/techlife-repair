-- ============================================
-- TechRepair SaaS - Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- GLOBAL TABLES (No tenant_id)
-- ============================================

-- Plans table
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2) NOT NULL,
  max_users INTEGER DEFAULT 5,
  max_clients INTEGER DEFAULT 100,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenants (Companies)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('active', 'suspended', 'trial')),
  plan_id UUID REFERENCES public.plans(id),
  payment_due_date TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Super Admins (SaaS owners)
CREATE TABLE public.super_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- SaaS Payments (global, references tenant)
CREATE TABLE public.saas_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  payment_method TEXT NOT NULL,
  external_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TENANT-SCOPED TABLES
-- ============================================

-- Users (tenant members)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'technician' CHECK (role IN ('admin', 'technician', 'client')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, auth_user_id),
  UNIQUE(tenant_id, email)
);

-- Clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  tax_id TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  contacts JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Orders
CREATE TABLE public.work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technical Reports
CREATE TABLE public.technical_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES public.users(id),
  diagnosis TEXT NOT NULL,
  work_performed TEXT NOT NULL,
  recommendations TEXT,
  signature_client TEXT,
  signature_tech TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  exported_at TIMESTAMPTZ
);

-- Product Categories
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.product_categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.product_categories(id),
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit_price DECIMAL(10,2) DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  track_serials BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, sku)
);

-- Product Serials
CREATE TABLE public.product_serials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  serial_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'sold', 'defective')),
  assigned_to_order UUID REFERENCES public.work_orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, serial_number)
);

-- Inventory Movements
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  serial_id UUID REFERENCES public.product_serials(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES public.work_orders(id),
  invoice_number TEXT NOT NULL,
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, invoice_number)
);

-- Invoice Lines
CREATE TABLE public.invoice_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  product_id UUID REFERENCES public.products(id)
);

-- Payments (client payments)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  payment_method TEXT NOT NULL,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounting Entries
CREATE TABLE public.accounting_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entry_date TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_tenant ON public.users(tenant_id);
CREATE INDEX idx_users_auth ON public.users(auth_user_id);
CREATE INDEX idx_clients_tenant ON public.clients(tenant_id);
CREATE INDEX idx_work_orders_tenant_status ON public.work_orders(tenant_id, status);
CREATE INDEX idx_work_orders_tenant_assigned ON public.work_orders(tenant_id, assigned_to);
CREATE INDEX idx_work_orders_client ON public.work_orders(client_id);
CREATE INDEX idx_reports_tenant ON public.technical_reports(tenant_id);
CREATE INDEX idx_reports_order ON public.technical_reports(work_order_id);
CREATE INDEX idx_products_tenant ON public.products(tenant_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_serials_tenant_status ON public.product_serials(tenant_id, status);
CREATE INDEX idx_serials_product ON public.product_serials(product_id);
CREATE INDEX idx_movements_tenant_product ON public.inventory_movements(tenant_id, product_id, created_at DESC);
CREATE INDEX idx_invoices_tenant_status ON public.invoices(tenant_id, status);
CREATE INDEX idx_invoices_client ON public.invoices(client_id);
CREATE INDEX idx_payments_tenant ON public.payments(tenant_id);
CREATE INDEX idx_accounting_tenant_date ON public.accounting_entries(tenant_id, entry_date DESC);
CREATE INDEX idx_saas_payments_tenant ON public.saas_payments(tenant_id);

-- Partial index for active orders
CREATE INDEX idx_work_orders_active ON public.work_orders(tenant_id, scheduled_date) 
  WHERE status IN ('open', 'in_progress');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get tenant_id from JWT claims (using public schema)
CREATE OR REPLACE FUNCTION public.get_tenant_id() 
RETURNS UUID AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid,
    NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin() 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins 
    WHERE user_id = auth.uid()
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Get user role from JWT claims
CREATE OR REPLACE FUNCTION public.get_user_role() 
RETURNS TEXT AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'role'),
    'client'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
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

-- PLANS (public read)
CREATE POLICY "plans_read_all" ON public.plans FOR SELECT USING (true);
CREATE POLICY "plans_manage_super" ON public.plans FOR ALL USING (public.is_super_admin());

-- TENANTS
CREATE POLICY "tenants_super_all" ON public.tenants FOR ALL USING (public.is_super_admin());
CREATE POLICY "tenants_read_own" ON public.tenants FOR SELECT USING (id = public.get_tenant_id());

-- SUPER_ADMINS
CREATE POLICY "super_admins_read" ON public.super_admins FOR SELECT USING (public.is_super_admin());

-- SAAS_PAYMENTS
CREATE POLICY "saas_payments_super" ON public.saas_payments FOR ALL USING (public.is_super_admin());
CREATE POLICY "saas_payments_read_own" ON public.saas_payments FOR SELECT USING (tenant_id = public.get_tenant_id());

-- USERS
CREATE POLICY "users_super_all" ON public.users FOR ALL USING (public.is_super_admin());
CREATE POLICY "users_tenant_read" ON public.users FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "users_admin_manage" ON public.users FOR ALL USING (
  tenant_id = public.get_tenant_id() AND 
  public.get_user_role() = 'admin'
);

-- CLIENTS
CREATE POLICY "clients_super_all" ON public.clients FOR ALL USING (public.is_super_admin());
CREATE POLICY "clients_tenant_read" ON public.clients FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "clients_admin_manage" ON public.clients FOR ALL USING (
  tenant_id = public.get_tenant_id() AND 
  public.get_user_role() = 'admin'
);

-- WORK_ORDERS
CREATE POLICY "work_orders_super_all" ON public.work_orders FOR ALL USING (public.is_super_admin());
CREATE POLICY "work_orders_tenant_read" ON public.work_orders FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "work_orders_admin_manage" ON public.work_orders FOR ALL USING (
  tenant_id = public.get_tenant_id() AND 
  public.get_user_role() = 'admin'
);
CREATE POLICY "work_orders_tech_update" ON public.work_orders FOR UPDATE USING (
  tenant_id = public.get_tenant_id() AND 
  assigned_to = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);

-- TECHNICAL_REPORTS
CREATE POLICY "reports_super_all" ON public.technical_reports FOR ALL USING (public.is_super_admin());
CREATE POLICY "reports_tenant_read" ON public.technical_reports FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "reports_tech_create" ON public.technical_reports FOR INSERT WITH CHECK (
  tenant_id = public.get_tenant_id() AND 
  technician_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);
CREATE POLICY "reports_tech_update" ON public.technical_reports FOR UPDATE USING (
  tenant_id = public.get_tenant_id() AND 
  technician_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);

-- PRODUCT_CATEGORIES
CREATE POLICY "categories_super_all" ON public.product_categories FOR ALL USING (public.is_super_admin());
CREATE POLICY "categories_tenant_read" ON public.product_categories FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "categories_admin_manage" ON public.product_categories FOR ALL USING (
  tenant_id = public.get_tenant_id() AND 
  public.get_user_role() = 'admin'
);

-- PRODUCTS
CREATE POLICY "products_super_all" ON public.products FOR ALL USING (public.is_super_admin());
CREATE POLICY "products_tenant_read" ON public.products FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "products_admin_manage" ON public.products FOR ALL USING (
  tenant_id = public.get_tenant_id() AND 
  public.get_user_role() = 'admin'
);

-- PRODUCT_SERIALS
CREATE POLICY "serials_super_all" ON public.product_serials FOR ALL USING (public.is_super_admin());
CREATE POLICY "serials_tenant_read" ON public.product_serials FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "serials_admin_manage" ON public.product_serials FOR ALL USING (
  tenant_id = public.get_tenant_id() AND 
  public.get_user_role() = 'admin'
);

-- INVENTORY_MOVEMENTS
CREATE POLICY "movements_super_all" ON public.inventory_movements FOR ALL USING (public.is_super_admin());
CREATE POLICY "movements_tenant_read" ON public.inventory_movements FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "movements_admin_manage" ON public.inventory_movements FOR ALL USING (
  tenant_id = public.get_tenant_id() AND 
  public.get_user_role() = 'admin'
);

-- INVOICES
CREATE POLICY "invoices_super_all" ON public.invoices FOR ALL USING (public.is_super_admin());
CREATE POLICY "invoices_tenant_read" ON public.invoices FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "invoices_admin_manage" ON public.invoices FOR ALL USING (
  tenant_id = public.get_tenant_id() AND 
  public.get_user_role() = 'admin'
);

-- INVOICE_LINES (inherit from invoice)
CREATE POLICY "invoice_lines_super_all" ON public.invoice_lines FOR ALL USING (public.is_super_admin());
CREATE POLICY "invoice_lines_read" ON public.invoice_lines FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE id = invoice_lines.invoice_id 
    AND tenant_id = public.get_tenant_id()
  )
);

-- PAYMENTS
CREATE POLICY "payments_super_all" ON public.payments FOR ALL USING (public.is_super_admin());
CREATE POLICY "payments_tenant_read" ON public.payments FOR SELECT USING (tenant_id = public.get_tenant_id());
CREATE POLICY "payments_admin_manage" ON public.payments FOR ALL USING (
  tenant_id = public.get_tenant_id() AND 
  public.get_user_role() = 'admin'
);

-- ACCOUNTING_ENTRIES
CREATE POLICY "accounting_super_all" ON public.accounting_entries FOR ALL USING (public.is_super_admin());
CREATE POLICY "accounting_tenant_read" ON public.accounting_entries FOR SELECT USING (
  tenant_id = public.get_tenant_id() AND 
  public.get_user_role() = 'admin'
);
CREATE POLICY "accounting_admin_manage" ON public.accounting_entries FOR ALL USING (
  tenant_id = public.get_tenant_id() AND 
  public.get_user_role() = 'admin'
);

-- ============================================
-- SEED DATA - Default Plans
-- ============================================

INSERT INTO public.plans (name, price_monthly, price_yearly, max_users, max_clients, features) VALUES
('Starter', 29.00, 290.00, 3, 50, '{"modules": ["clients", "work_orders", "reports"]}'),
('Professional', 59.00, 590.00, 10, 200, '{"modules": ["clients", "work_orders", "reports", "inventory", "invoices"]}'),
('Enterprise', 99.00, 990.00, -1, -1, '{"modules": ["clients", "work_orders", "reports", "inventory", "invoices", "accounting"]}');

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_work_orders_updated_at
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
