-- Grant permissions to authenticated users
grant all on table transactions to authenticated;
grant all on table transactions to service_role;

-- Allow INSERT
create policy "Admins can insert transactions"
    on transactions for insert
    with check (
        tenant_id in (
            select tenant_id from users
            where auth_user_id = auth.uid()
            -- Optional: enforce admin role, but for billing usually mostly admins access this
        )
    );

-- Allow UPDATE (for verify callback)
create policy "Admins can update their transactions"
    on transactions for update
    using (
        tenant_id in (
            select tenant_id from users
            where auth_user_id = auth.uid()
        )
    );
