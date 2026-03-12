-- Agregar política RLS faltante para DELETE en pedidos (admin)
-- La migración original solo definió SELECT, INSERT y UPDATE para pedidos
-- pero no incluyó DELETE, lo cual impedía eliminar pedidos desde el panel admin.

CREATE POLICY "pedidos_delete_admin"
  ON pedidos FOR DELETE
  USING (es_admin());
