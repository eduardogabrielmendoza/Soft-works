-- Allow guest checkout: make usuario_id nullable on pedidos
ALTER TABLE pedidos ALTER COLUMN usuario_id DROP NOT NULL;

-- Update RLS policies to allow anonymous order creation via service role
-- (guest orders are created server-side with service role, so no RLS changes needed for anon)
-- Admins already have full access via existing policy
