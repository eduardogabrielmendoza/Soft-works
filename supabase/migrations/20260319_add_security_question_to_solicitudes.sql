-- Add pregunta_seguridad column to solicitudes_recuperacion
-- This stores the security question from the user's profile at request time
ALTER TABLE solicitudes_recuperacion ADD COLUMN IF NOT EXISTS pregunta_seguridad TEXT;
ALTER TABLE solicitudes_recuperacion ADD COLUMN IF NOT EXISTS respuesta_seguridad TEXT;
