-- Add payment method tracking columns to pedidos
-- metodo_pago: 'transferencia' | 'mercadopago'
-- mp_preference_id: MercadoPago preference ID
-- mp_payment_id: MercadoPago payment ID

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS metodo_pago TEXT DEFAULT 'transferencia';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS mp_preference_id TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS mp_payment_id TEXT;

-- Index for quick lookups by MP payment
CREATE INDEX IF NOT EXISTS idx_pedidos_mp_payment ON pedidos(mp_payment_id) WHERE mp_payment_id IS NOT NULL;
