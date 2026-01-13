-- =====================================================
-- TechRepair SaaS - Phase 4 Tables
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. ACCOUNTING ENTRIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS accounting_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    reference TEXT,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounting_entries_tenant_isolation" ON accounting_entries
    FOR ALL USING (
        tenant_id = get_my_tenant_id() OR is_super_admin()
    );

-- Grants
GRANT ALL ON accounting_entries TO authenticated;

-- Index
CREATE INDEX IF NOT EXISTS idx_accounting_entries_tenant_date 
    ON accounting_entries(tenant_id, entry_date DESC);

-- =====================================================
-- 2. SUBSCRIPTION / BILLING TABLES (for SaaS)
-- =====================================================

-- Add subscription fields to tenants if not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE tenants 
            ADD COLUMN subscription_status TEXT DEFAULT 'trial' 
                CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled', 'suspended')),
            ADD COLUMN trial_ends_at TIMESTAMPTZ,
            ADD COLUMN current_period_start TIMESTAMPTZ,
            ADD COLUMN current_period_end TIMESTAMPTZ;
    END IF;
END $$;

-- Subscription payments (SaaS payments, not client payments)
CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id),
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT,
    payment_reference TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for subscription_payments
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_payments_tenant_or_super" ON subscription_payments
    FOR ALL USING (
        tenant_id = get_my_tenant_id() OR is_super_admin()
    );

GRANT SELECT ON subscription_payments TO authenticated;

-- =====================================================
-- END
-- =====================================================
