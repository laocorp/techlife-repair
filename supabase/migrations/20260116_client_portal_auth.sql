-- =============================================
-- CLIENT PORTAL AUTH CODES
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Create client_auth_codes table for OTP
CREATE TABLE IF NOT EXISTS public.client_auth_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_client_auth_codes_lookup 
ON public.client_auth_codes(client_id, code, expires_at);

-- 3. Enable RLS
ALTER TABLE public.client_auth_codes ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy - Only system can manage codes
CREATE POLICY "System manages auth codes" ON public.client_auth_codes
    FOR ALL USING (true) WITH CHECK (true);

-- 5. Function to generate and send auth code
CREATE OR REPLACE FUNCTION public.generate_client_auth_code(p_client_email TEXT, p_tenant_slug TEXT)
RETURNS JSON AS $$
DECLARE
    v_client_id UUID;
    v_tenant_id UUID;
    v_code VARCHAR(6);
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Find tenant by slug (case-insensitive)
    SELECT id INTO v_tenant_id 
    FROM public.tenants 
    WHERE LOWER(slug) = LOWER(p_tenant_slug);
    
    IF v_tenant_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Empresa no encontrada');
    END IF;
    
    -- Find client by email in this tenant
    SELECT id INTO v_client_id 
    FROM public.clients 
    WHERE email = p_client_email AND tenant_id = v_tenant_id;
    
    IF v_client_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No encontramos una cuenta con este email');
    END IF;
    
    -- Generate 6-digit code
    v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    v_expires_at := NOW() + INTERVAL '10 minutes';
    
    -- Invalidate previous codes
    UPDATE public.client_auth_codes 
    SET used = true 
    WHERE client_id = v_client_id AND used = false;
    
    -- Insert new code
    INSERT INTO public.client_auth_codes (client_id, code, expires_at)
    VALUES (v_client_id, v_code, v_expires_at);
    
    -- Return success (code will be sent via edge function/email)
    RETURN json_build_object(
        'success', true, 
        'client_id', v_client_id,
        'code', v_code,  -- In production, don't return this - send via email
        'expires_at', v_expires_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to verify auth code
CREATE OR REPLACE FUNCTION public.verify_client_auth_code(p_client_id UUID, p_code VARCHAR(6))
RETURNS JSON AS $$
DECLARE
    v_valid BOOLEAN;
    v_client RECORD;
BEGIN
    -- Check if code is valid
    SELECT EXISTS (
        SELECT 1 FROM public.client_auth_codes
        WHERE client_id = p_client_id
        AND code = p_code
        AND expires_at > NOW()
        AND used = false
    ) INTO v_valid;
    
    IF NOT v_valid THEN
        RETURN json_build_object('success', false, 'error', 'Código inválido o expirado');
    END IF;
    
    -- Mark code as used
    UPDATE public.client_auth_codes
    SET used = true
    WHERE client_id = p_client_id AND code = p_code;
    
    -- Get client info
    SELECT c.*, t.name as tenant_name, t.slug as tenant_slug
    INTO v_client
    FROM public.clients c
    JOIN public.tenants t ON c.tenant_id = t.id
    WHERE c.id = p_client_id;
    
    RETURN json_build_object(
        'success', true,
        'client', json_build_object(
            'id', v_client.id,
            'name', v_client.name,
            'email', v_client.email,
            'tenant_id', v_client.tenant_id,
            'tenant_name', v_client.tenant_name,
            'tenant_slug', v_client.tenant_slug
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_client_auth_code TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_client_auth_code TO anon, authenticated;

-- =============================================
-- DONE! Client portal auth ready
-- =============================================
