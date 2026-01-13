create type transaction_status as enum ('pending', 'completed', 'failed', 'cancelled');

create table transactions (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id) not null,
    plan_id uuid references plans(id) not null,
    amount integer not null, -- in cents
    provider text not null default 'payphone',
    provider_transaction_id text, -- payphone paymentId
    client_transaction_id text not null, -- our unique ref
    status transaction_status default 'pending',
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table transactions enable row level security;

create policy "Admins can view their own transactions"
    on transactions for select
    using (
        tenant_id in (
            select tenant_id from users
            where auth_user_id = auth.uid()
            and role = 'admin'
        )
    );
