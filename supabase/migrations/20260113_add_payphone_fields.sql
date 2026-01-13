alter table tenants 
add column payphone_card_token text,
add column payphone_card_data jsonb default '{}'::jsonb;

-- Optional: Add status for recurring billing
alter table tenants add column auto_renew boolean default true;
