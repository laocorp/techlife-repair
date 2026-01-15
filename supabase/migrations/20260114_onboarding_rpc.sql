-- =====================================================
-- FUNCTION: Complete Onboarding (Security Definer)
-- Solves RLS issues when creating first Tenant + User
-- =====================================================

CREATE OR REPLACE FUNCTION public.complete_user_onboarding(
    p_company_name TEXT,
    p_slug TEXT,
    p_full_name TEXT,
    p_phone TEXT,
    p_plan_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with Superuser privileges
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
    v_tenant_id UUID;
    v_new_user_id UUID;
BEGIN
    -- 1. Get executing user ID and Email
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

    -- 2. Validate Slug Uniqueness
    IF EXISTS (SELECT 1 FROM tenants WHERE slug = p_slug) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Slug already exists');
    END IF;

    -- 3. Check if user already has a tenant (optional, but good safety)
    IF EXISTS (SELECT 1 FROM users WHERE auth_user_id = v_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'User already assigned to a tenant');
    END IF;

    -- 4. Create Tenant
    INSERT INTO tenants (
        name,
        slug,
        status,
        plan_id,
        payment_due_date
    ) VALUES (
        p_company_name,
        p_slug,
        'trial',
        p_plan_id,
        (NOW() + INTERVAL '14 days')
    )
    RETURNING id INTO v_tenant_id;

    -- 5. Create User
    INSERT INTO users (
        tenant_id,
        auth_user_id,
        role,
        full_name,
        email,
        phone
    ) VALUES (
        v_tenant_id,
        v_user_id,
        'admin',
        p_full_name,
        v_email,
        p_phone
    )
    RETURNING id INTO v_new_user_id;

    -- 6. Return Success
    RETURN jsonb_build_object(
        'success', true, 
        'tenant_id', v_tenant_id, 
        'user_id', v_new_user_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.complete_user_onboarding TO authenticated;
