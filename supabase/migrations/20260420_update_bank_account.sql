-- ============================================================
-- Actualizar datos bancarios al Banco Galicia
-- ============================================================

-- Eliminar todas las cuentas existentes e insertar la nueva
DELETE FROM cuentas_bancarias;

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
);
