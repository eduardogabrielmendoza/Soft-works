-- Add 'finalizado' to estado_pedido enum
ALTER TYPE estado_pedido ADD VALUE IF NOT EXISTS 'finalizado';
