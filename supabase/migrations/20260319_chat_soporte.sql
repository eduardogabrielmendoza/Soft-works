-- =============================================
-- TABLA: chats (Conversaciones de soporte)
-- =============================================
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'resuelto')),
  fecha_creacion TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chats_usuario ON chats(usuario_id);
CREATE INDEX IF NOT EXISTS idx_chats_estado ON chats(estado);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Usuarios ven sus propios chats
CREATE POLICY "Usuarios pueden ver sus chats"
  ON chats FOR SELECT
  USING (auth.uid() = usuario_id);

-- Usuarios pueden crear sus chats
CREATE POLICY "Usuarios pueden crear sus chats"
  ON chats FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Usuarios pueden actualizar sus chats
CREATE POLICY "Usuarios pueden actualizar sus chats"
  ON chats FOR UPDATE
  USING (auth.uid() = usuario_id);

-- Admins gestionan todos los chats
CREATE POLICY "Admins pueden gestionar todos los chats"
  ON chats FOR ALL
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- =============================================
-- TABLA: chat_mensajes (Mensajes de chat)
-- =============================================
CREATE TABLE IF NOT EXISTS chat_mensajes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'mensaje' CHECK (tipo IN ('mensaje', 'milestone')),
  fecha_creacion TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_mensajes_chat ON chat_mensajes(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_mensajes_fecha ON chat_mensajes(fecha_creacion);

ALTER TABLE chat_mensajes ENABLE ROW LEVEL SECURITY;

-- Usuarios ven mensajes de sus chats
CREATE POLICY "Usuarios pueden ver mensajes de sus chats"
  ON chat_mensajes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM chats WHERE chats.id = chat_mensajes.chat_id AND chats.usuario_id = auth.uid())
  );

-- Usuarios pueden enviar mensajes en sus chats
CREATE POLICY "Usuarios pueden enviar mensajes en sus chats"
  ON chat_mensajes FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM chats WHERE chats.id = chat_mensajes.chat_id AND chats.usuario_id = auth.uid())
    AND auth.uid() = autor_id
  );

-- Admins gestionan todos los mensajes
CREATE POLICY "Admins pueden gestionar todos los mensajes"
  ON chat_mensajes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Enable realtime for chat_mensajes
ALTER PUBLICATION supabase_realtime ADD TABLE chat_mensajes;
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
