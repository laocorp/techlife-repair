-- =====================================================
-- FIX: Políticas RLS faltantes para webhook_logs
-- =====================================================

-- Permitir a usuarios autenticados INSERTAR logs de sus propios webhooks
CREATE POLICY "Users can insert webhook logs for own webhooks"
  ON webhook_logs FOR INSERT
  WITH CHECK (
    webhook_id IN (
      SELECT id FROM webhooks WHERE tenant_id IN (
        SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Verificar políticas creadas
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'webhook_logs'
ORDER BY policyname;
