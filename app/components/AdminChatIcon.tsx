'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const [unreadChatIds, setUnreadChatIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const userIdRef = useRef<string | null>(null);
  const selectedChatIdRef = useRef<string | null>(null);
  const chatsRef = useRef<Chat[]>([]);
  const hasLoadedRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { userIdRef.current = user?.id ?? null; }, [user?.id]);
  useEffect(() => { selectedChatIdRef.current = selectedChatId; }, [selectedChatId]);
  useEffect(() => { chatsRef.current = chats; }, [chats]);

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
    if (!isAdmin || !user?.id) return;
    if (!hasLoadedRef.current) setIsLoading(true);
    const supabase = getSupabaseClient();
    const currentUserId = user.id;

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
            .select('contenido, tipo, autor_id, id')
            .eq('chat_id', chat.id)
            .order('fecha_creacion', { ascending: false })
            .limit(1);

          // Detect unread: last message is from client and admin hasn't read it
          if (lastMsg?.[0] && lastMsg[0].autor_id !== currentUserId && lastMsg[0].tipo === 'mensaje') {
            const lastReadId = localStorage.getItem(`admin-lastread-${chat.id}`);
            if (lastReadId !== lastMsg[0].id) {
              setUnreadChatIds((prev) => {
                const next = new Set(prev);
                next.add(chat.id);
                return next;
              });
            }
          }

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
    hasLoadedRef.current = true;
  }, [isAdmin, user?.id]);

  useEffect(() => { loadChats(); }, [loadChats]);

  // Realtime + polling fallback for chat list
  useEffect(() => {
    if (!isAdmin) return;
    const supabase = getSupabaseClient();

    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
        loadChats();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_mensajes',
      }, (payload: any) => {
        const newMsg = payload.new;
        if (newMsg.autor_id !== userIdRef.current && newMsg.chat_id !== selectedChatIdRef.current) {
          setUnreadChatIds((prev) => {
            const next = new Set(prev);
            next.add(newMsg.chat_id);
            return next;
          });
        }
        loadChats();
      })
      .subscribe();

    // Polling fallback every 3s - reload chat list and detect new unread
    const poll = setInterval(async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: chatList } = await (supabase as any)
        .from('chats')
        .select('id, usuario_id, estado, fecha_creacion, fecha_actualizacion')
        .or(`estado.eq.activo,and(estado.eq.resuelto,fecha_actualizacion.gte.${oneHourAgo})`)
        .order('fecha_actualizacion', { ascending: false });

      if (chatList) {
        // Check each chat for new messages since last known update
        for (const chat of chatList) {
          const existing = chatsRef.current.find((c: Chat) => c.id === chat.id);
          if (existing && chat.fecha_actualizacion !== existing.fecha_actualizacion && chat.id !== selectedChatIdRef.current) {
            // Chat was updated — check if there's a new client message
            const { data: lastMsg } = await (supabase as any)
              .from('chat_mensajes')
              .select('autor_id')
              .eq('chat_id', chat.id)
              .order('fecha_creacion', { ascending: false })
              .limit(1);
            if (lastMsg?.[0]?.autor_id !== userIdRef.current) {
              setUnreadChatIds((prev) => {
                const next = new Set(prev);
                next.add(chat.id);
                return next;
              });
            }
          }
        }
        // Reload full chat list
        loadChats();
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [isAdmin, loadChats]);

  // Realtime for selected chat messages + polling fallback
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

    // Poll messages for the open chat every 3s
    const poll = setInterval(async () => {
      const { data } = await (supabase as any)
        .from('chat_mensajes')
        .select('*')
        .eq('chat_id', selectedChatId)
        .order('fecha_creacion', { ascending: true });
      if (data) {
        setMessages((prev) => {
          if (data.length === prev.length && data.length > 0 && data[data.length - 1].id === prev[prev.length - 1]?.id) return prev;
          return data;
        });
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [selectedChatId]);

  const openChat = async (chatId: string) => {
    setSelectedChatId(chatId);
    // Mark this chat as read
    setUnreadChatIds((prev) => {
      const next = new Set(prev);
      next.delete(chatId);
      return next;
    });
    const supabase = getSupabaseClient();
    const { data } = await (supabase as any)
      .from('chat_mensajes')
      .select('*')
      .eq('chat_id', chatId)
      .order('fecha_creacion', { ascending: true });
    if (data) {
      setMessages(data);
      // Save last message id as read marker
      if (data.length > 0) {
        localStorage.setItem(`admin-lastread-${chatId}`, data[data.length - 1].id);
      }
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChatId || isSending) return;
    setIsSending(true);
    const supabase = getSupabaseClient();

    // If chat was resolved, reactivate it when admin sends a new message
    const currentChat = chats.find((c) => c.id === selectedChatId);
    if (currentChat?.estado === 'resuelto') {
      await (supabase as any).from('chats').update({
        estado: 'activo',
        fecha_actualizacion: new Date().toISOString(),
      }).eq('id', selectedChatId);
    }

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
  const unreadCount = unreadChatIds.size;

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
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
          {/* Mobile backdrop */}
          <div className="fixed inset-0 bg-black/20 z-[59] lg:hidden" onClick={() => setIsOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-x-3 top-[64px] max-h-[calc(100vh-80px)] lg:absolute lg:inset-x-auto lg:top-auto lg:right-0 lg:mt-2 lg:w-96 lg:max-h-none bg-white rounded-lg shadow-xl border border-gray-200 z-[60] overflow-hidden"
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
                <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
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
                            <p className="text-[10px] font-medium text-gray-500 mb-0.5">{selectedChat?.usuario_nombre || 'Cliente'}</p>
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
                  {selectedChat?.estado === 'resuelto' && (
                    <p className="text-[10px] text-center text-gray-400 mb-1">✓ Consulta resuelta — el cliente puede reabrir escribiendo</p>
                  )}
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
                </div>
              </div>
            ) : (
              /* Chat list view */
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-medium text-sm">Chats de soporte</h3>
                </div>

                <div className="max-h-80 overflow-y-auto overscroll-contain">
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
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
