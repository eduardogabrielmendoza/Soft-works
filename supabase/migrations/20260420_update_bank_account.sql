-- ============================================================
-- Actualizar datos bancarios al Banco Galicia
-- ============================================================

-- Desactivar todas las cuentas existentes
UPDATE cuentas_bancarias SET activa = false;

-- Insertar la nueva cuenta de Banco Galicia (o actualizar si ya existe con ese CBU)
INSERT INTO cuentas_bancarias (banco, titular, cuit, cbu, alias, tipo_cuenta, activa, orden_visualizacion)
VALUES (
  'Banco Galicia',
  'CRISTALDO MAURICI BERNAL',
  '20-43727062-8',
  '0070020730004048786497',
  'TOPE.JABON.CEREZO',
  'corriente',
  true,
  1
)
ON CONFLICT (cbu) DO UPDATE SET
  banco = EXCLUDED.banco,
  titular = EXCLUDED.titular,
  cuit = EXCLUDED.cuit,
  alias = EXCLUDED.alias,
  activa = true,
  orden_visualizacion = 1;
