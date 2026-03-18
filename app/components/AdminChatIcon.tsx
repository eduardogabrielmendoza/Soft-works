'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Chat {
  id: string;
  usuario_id: string;
  estado: 'activo' | 'resuelto';
  fecha_creacion: string;
  fecha_actualizacion: string;
  usuario_nombre?: string;
  ultimo_mensaje?: string;
}

interface ChatMessage {
  id: string;
  chat_id: string;
  autor_id: string;
  contenido: string;
  tipo: 'mensaje' | 'milestone';
  fecha_creacion: string;
}

export default function AdminChatIcon() {
  const { user, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load active chats
  const loadChats = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    const supabase = getSupabaseClient();

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: chatList } = await (supabase as any)
      .from('chats')
      .select('*')
      .or(`estado.eq.activo,and(estado.eq.resuelto,fecha_actualizacion.gte.${oneHourAgo})`)
      .order('fecha_actualizacion', { ascending: false });

    if (chatList) {
      const enriched = await Promise.all(
        chatList.map(async (chat: Chat) => {
          const { data: perfil } = await (supabase as any)
            .from('perfiles')
            .select('nombre, apellido')
            .eq('id', chat.usuario_id)
            .single();

          const { data: lastMsg } = await (supabase as any)
            .from('chat_mensajes')
            .select('contenido, tipo')
            .eq('chat_id', chat.id)
            .order('fecha_creacion', { ascending: false })
            .limit(1);

          return {
            ...chat,
            usuario_nombre: perfil ? `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim() || 'Usuario' : 'Usuario',
            ultimo_mensaje: lastMsg?.[0]?.contenido || 'Sin mensajes',
          };
        })
      );
      setChats(enriched);
    }
    setIsLoading(false);
  }, [isAdmin]);

  useEffect(() => { loadChats(); }, [loadChats]);

  // Realtime: new chats + updates
  useEffect(() => {
    if (!isAdmin) return;
    const supabase = getSupabaseClient();
    const chatChannel = supabase
      .channel('admin-chats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
        loadChats();
      })
      .subscribe();
    return () => { supabase.removeChannel(chatChannel); };
  }, [isAdmin, loadChats]);

  // Realtime for selected chat messages
  useEffect(() => {
    if (!selectedChatId) return;
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`admin-chat-msgs-${selectedChatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_mensajes',
        filter: `chat_id=eq.${selectedChatId}`,
      }, (payload: any) => {
        setMessages((prev) => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new as ChatMessage];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedChatId]);

  const openChat = async (chatId: string) => {
    setSelectedChatId(chatId);
    const supabase = getSupabaseClient();
    const { data } = await (supabase as any)
      .from('chat_mensajes')
      .select('*')
      .eq('chat_id', chatId)
      .order('fecha_creacion', { ascending: true });
    if (data) setMessages(data);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChatId || isSending) return;
    setIsSending(true);
    const supabase = getSupabaseClient();

    const { error } = await (supabase as any).from('chat_mensajes').insert({
      chat_id: selectedChatId,
      autor_id: user!.id,
      contenido: newMessage.trim(),
      tipo: 'mensaje',
    });

    if (error) {
      console.error('Error sending admin message:', error);
    } else {
      await (supabase as any).from('chats').update({
        fecha_actualizacion: new Date().toISOString(),
      }).eq('id', selectedChatId);
      setNewMessage('');
    }
    setIsSending(false);
  };

  const handleResolve = async () => {
    if (!selectedChatId || isResolving) return;
    setIsResolving(true);
    const supabase = getSupabaseClient();

    await (supabase as any).from('chat_mensajes').insert({
      chat_id: selectedChatId,
      autor_id: user!.id,
      contenido: 'Consulta marcada como resuelta',
      tipo: 'milestone',
    });

    await (supabase as any).from('chats').update({
      estado: 'resuelto',
      fecha_actualizacion: new Date().toISOString(),
    }).eq('id', selectedChatId);

    // Update local state instead of clearing
    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedChatId ? { ...c, estado: 'resuelto' as const } : c
      )
    );
    setIsResolving(false);
    loadChats();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const selectedChat = chats.find((c) => c.id === selectedChatId);
  const activeCount = chats.filter((c) => c.estado === 'activo').length;

  if (!isAdmin) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Chats de soporte"
      >
        <MessageSquare className="w-5 h-5" />
        {activeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {activeCount > 9 ? '9+' : activeCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
          >
            {selectedChatId ? (
              /* Individual chat view */
              <div className="flex flex-col h-[28rem]">
                {/* Chat header */}
                <div className="px-4 py-3 bg-foreground text-white flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setSelectedChatId(null); setMessages([]); }}
                      className="p-1 hover:bg-white/20 rounded"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h3 className="font-medium text-sm">{selectedChat?.usuario_nombre || 'Usuario'}</h3>
                      <p className="text-[11px] opacity-80">Chat de soporte</p>
                    </div>
                  </div>
                  {selectedChat?.estado !== 'resuelto' && (
                    <button
                      type="button"
                      onClick={handleResolve}
                      disabled={isResolving}
                      className="p-1.5 hover:bg-white/20 rounded flex items-center gap-1 text-[11px]"
                      title="Marcar como resuelto"
                    >
                      {isResolving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    msg.tipo === 'milestone' ? (
                      <div key={msg.id} className="flex justify-center">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-[11px] rounded-full font-medium">
                          ✓ {msg.contenido}
                        </span>
                      </div>
                    ) : (
                      <div
                        key={msg.id}
                        className={`flex ${msg.autor_id === user!.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                            msg.autor_id === user!.id
                              ? 'bg-foreground text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {msg.autor_id !== user!.id && (
                            <p className="text-[10px] font-medium text-gray-500 mb-0.5">Cliente</p>
                          )}
                          <p className="whitespace-pre-wrap">{msg.contenido}</p>
                          <p className={`text-[10px] mt-1 ${
                            msg.autor_id === user!.id ? 'text-white/60' : 'text-gray-400'
                          }`}>
                            {formatTime(msg.fecha_creacion)}
                          </p>
                        </div>
                      </div>
                    )
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-3 py-2 border-t border-gray-200 flex-shrink-0">
                  {selectedChat?.estado === 'resuelto' ? (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500">✓ Consulta resuelta</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">El chat se archivará automáticamente en menos de 1 hora</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribí tu respuesta..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                      />
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={!newMessage.trim() || isSending}
                        className="p-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50"
                      >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Chat list view */
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-medium text-sm">Chats de soporte</h3>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : chats.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-12">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No hay chats activos</p>
                    </div>
                  ) : (
                    chats.map((chat) => (
                      <button
                        type="button"
                        key={chat.id}
                        onClick={() => openChat(chat.id)}
                        className={`w-full px-4 py-3 border-b border-gray-50 hover:bg-gray-50 text-left transition-colors ${
                          chat.estado === 'resuelto' ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{chat.usuario_nombre}</p>
                            {chat.estado === 'resuelto' && (
                              <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Resuelto</span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {new Date(chat.fecha_actualizacion).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{chat.ultimo_mensaje}</p>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
