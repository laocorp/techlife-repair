-- =============================================
-- NOTIFICATIONS SYSTEM SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- NULL = all users in tenant
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    metadata JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON public.notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Users can see notifications for their tenant (either to them specifically or to all)
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
        )
        AND (
            user_id IS NULL 
            OR user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        )
    );

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
        )
        AND (
            user_id IS NULL 
            OR user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        )
    );

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
        )
        AND (
            user_id IS NULL 
            OR user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        )
    );

-- System can insert notifications (via triggers)
CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- =============================================
-- NOTIFICATION TRIGGERS
-- =============================================

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
    p_tenant_id UUID,
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO public.notifications (tenant_id, user_id, type, title, message, metadata)
    VALUES (p_tenant_id, p_user_id, p_type, p_title, p_message, p_metadata)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: New work order created
CREATE OR REPLACE FUNCTION public.notify_on_work_order_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.create_notification(
        NEW.tenant_id,
        NULL, -- All users in tenant
        'order_created',
        'Nueva orden recibida',
        'Orden #' || NEW.order_number || ' - ' || NEW.device_type,
        jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_work_order_created ON public.work_orders;
CREATE TRIGGER trigger_notify_work_order_created
    AFTER INSERT ON public.work_orders
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_work_order_created();

-- Trigger: Work order status changed
CREATE OR REPLACE FUNCTION public.notify_on_work_order_status_changed()
RETURNS TRIGGER AS $$
DECLARE
    v_status_label TEXT;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Map status to Spanish label
        v_status_label := CASE NEW.status
            WHEN 'pending' THEN 'Pendiente'
            WHEN 'diagnosed' THEN 'Diagnosticado'
            WHEN 'approved' THEN 'Aprobado'
            WHEN 'in_progress' THEN 'En Reparación'
            WHEN 'completed' THEN 'Completado'
            WHEN 'delivered' THEN 'Entregado'
            WHEN 'cancelled' THEN 'Cancelado'
            ELSE NEW.status
        END;
        
        PERFORM public.create_notification(
            NEW.tenant_id,
            NULL,
            'order_status_changed',
            'Orden actualizada',
            'Orden #' || NEW.order_number || ' cambió a: ' || v_status_label,
            jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'new_status', NEW.status)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_work_order_status ON public.work_orders;
CREATE TRIGGER trigger_notify_work_order_status
    AFTER UPDATE ON public.work_orders
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_work_order_status_changed();

-- Trigger: Payment received
CREATE OR REPLACE FUNCTION public.notify_on_payment_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.create_notification(
        NEW.tenant_id,
        NULL,
        'payment_received',
        'Pago registrado',
        'Se registró un pago de $' || NEW.amount::TEXT,
        jsonb_build_object('payment_id', NEW.id, 'amount', NEW.amount)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_payment_created ON public.payments;
CREATE TRIGGER trigger_notify_payment_created
    AFTER INSERT ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_payment_created();

-- Trigger: Low stock alert (when product stock goes below min_stock)
CREATE OR REPLACE FUNCTION public.notify_on_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock <= NEW.min_stock AND (OLD.stock IS NULL OR OLD.stock > OLD.min_stock) THEN
        PERFORM public.create_notification(
            NEW.tenant_id,
            NULL,
            'low_stock',
            'Stock bajo',
            'El producto "' || NEW.name || '" tiene stock bajo (' || NEW.stock || ' unidades)',
            jsonb_build_object('product_id', NEW.id, 'product_name', NEW.name, 'current_stock', NEW.stock)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_low_stock ON public.products;
CREATE TRIGGER trigger_notify_low_stock
    AFTER UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_low_stock();

-- Grant permissions
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO authenticated;

-- =============================================
-- DONE! Notifications system ready
-- =============================================
