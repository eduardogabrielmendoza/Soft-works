-- =============================================
-- Migration: Atomic order number generation
-- Fixes race condition in concurrent order creation
-- =============================================

-- Create a sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS pedido_numero_seq;

-- Sync the sequence with existing orders so it starts after the current count
SELECT setval('pedido_numero_seq', COALESCE((SELECT COUNT(*) FROM pedidos), 0));

-- Create atomic order number generation function
-- Uses nextval() which is transaction-safe and never returns duplicates
CREATE OR REPLACE FUNCTION generar_numero_pedido()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  seq_val bigint;
  letters text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  suffix text;
BEGIN
  seq_val := nextval('pedido_numero_seq');
  suffix := substr(letters, floor(random() * 24 + 1)::int, 1) ||
            substr(letters, floor(random() * 24 + 1)::int, 1);
  RETURN 'SW-' || lpad(seq_val::text, 7, '0') || '-' || suffix;
END;
$$;

-- Allow both authenticated users and service role to call this function
GRANT EXECUTE ON FUNCTION generar_numero_pedido() TO authenticated;
GRANT EXECUTE ON FUNCTION generar_numero_pedido() TO service_role;

-- Add a unique constraint on numero_pedido as a safety net
-- (uses IF NOT EXISTS logic via DO block for idempotency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_numero_pedido_unique'
  ) THEN
    ALTER TABLE pedidos ADD CONSTRAINT pedidos_numero_pedido_unique UNIQUE (numero_pedido);
  END IF;
END $$;
