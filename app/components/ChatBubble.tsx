'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, Send, X as XIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { getSupabaseClient } from '@/lib/supabase/client';

interface ChatMessage {
  id: string;
  chat_id: string;
  autor_id: string;
  contenido: string;
  tipo: 'mensaje' | 'milestone';
  fecha_creacion: string;
}

export default function ChatBubble() {
  const { user, profile, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [resolvedAt, setResolvedAt] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Sync isOpen ref for use in realtime callbacks
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  // Auto-detect active or recently resolved chat on mount
  useEffect(() => {
    if (!user || isAdmin) return;

    const detectChat = async () => {
      const supabase = getSupabaseClient();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      // Check for active chat
      const { data: activeChats } = await (supabase as any)
        .from('chats')
        .select('id, estado, fecha_actualizacion')
        .eq('usuario_id', user.id)
        .eq('estado', 'activo')
        .order('fecha_creacion', { ascending: false })
        .limit(1);

      if (activeChats && activeChats.length > 0) {
        setChatId(activeChats[0].id);
        await loadMessages(activeChats[0].id);
        return;
      }

      // Check for recently resolved chat (within 1 hour)
      const { data: resolvedChats } = await (supabase as any)
        .from('chats')
        .select('id, estado, fecha_actualizacion')
        .eq('usuario_id', user.id)
        .eq('estado', 'resuelto')
        .gte('fecha_actualizacion', oneHourAgo)
        .order('fecha_actualizacion', { ascending: false })
        .limit(1);

      if (resolvedChats && resolvedChats.length > 0) {
        setChatId(resolvedChats[0].id);
        setIsResolved(true);
        setResolvedAt(resolvedChats[0].fecha_actualizacion);
        await loadMessages(resolvedChats[0].id);
      }
    };

    detectChat();
  }, [user, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-clear resolved chat after 1-hour grace period
  useEffect(() => {
    if (!isResolved || !resolvedAt) return;

    const resolvedTime = new Date(resolvedAt).getTime();
    const expiresAt = resolvedTime + 60 * 60 * 1000;
    const remaining = expiresAt - Date.now();

    if (remaining <= 0) {
      setChatId(null);
      setMessages([]);
      setIsResolved(false);
      setResolvedAt(null);
      return;
    }

    const timeout = setTimeout(() => {
      setChatId(null);
      setMessages([]);
      setIsResolved(false);
      setResolvedAt(null);
    }, remaining);

    return () => clearTimeout(timeout);
  }, [isResolved, resolvedAt]);

  // Load or create chat when opened
  const openChat = async () => {
    setIsOpen(true);
    setUnreadCount(0);
    if (chatId) return;
    setIsLoading(true);

    const supabase = getSupabaseClient();

    // Find existing active chat
    const { data: existingChats } = await (supabase as any)
      .from('chats')
      .select('id')
      .eq('usuario_id', user!.id)
      .eq('estado', 'activo')
      .order('fecha_creacion', { ascending: false })
      .limit(1);

    if (existingChats && existingChats.length > 0) {
      const id = existingChats[0].id;
      setChatId(id);
      await loadMessages(id);
    } else {
      // Create new chat
      const { data: newChat, error } = await (supabase as any)
        .from('chats')
        .insert({ usuario_id: user!.id })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat:', error);
      } else if (newChat) {
        setChatId(newChat.id);
        setMessages([]);
      }
    }
    setIsLoading(false);
  };

  const loadMessages = async (id: string) => {
    const supabase = getSupabaseClient();
    const { data } = await (supabase as any)
      .from('chat_mensajes')
      .select('*')
      .eq('chat_id', id)
      .order('fecha_creacion', { ascending: true });
    if (data) setMessages(data);
  };

  // Realtime subscription
  useEffect(() => {
    if (!chatId) return;
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_mensajes',
        filter: `chat_id=eq.${chatId}`,
      }, (payload: any) => {
        const newMsg = payload.new as ChatMessage;
        setMessages((prev) => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        // Track unread when window is closed and message is from someone else
        if (!isOpenRef.current && newMsg.autor_id !== user?.id) {
          setUnreadCount((prev) => prev + 1);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatId]);

  // Listen for chat state changes (resolved)
  useEffect(() => {
    if (!chatId) return;
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`chat-state-${chatId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chats',
        filter: `id=eq.${chatId}`,
      }, (payload: any) => {
        if (payload.new.estado === 'resuelto') {
          setIsResolved(true);
          setResolvedAt(payload.new.fecha_actualizacion);
        } else if (payload.new.estado === 'activo') {
          setIsResolved(false);
          setResolvedAt(null);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !chatId || isSending) return;
    setIsSending(true);
    const supabase = getSupabaseClient();

    // If chat was resolved, reactivate it before sending
    if (isResolved) {
      await (supabase as any).from('chats').update({
        estado: 'activo',
        fecha_actualizacion: new Date().toISOString(),
      }).eq('id', chatId);
      setIsResolved(false);
      setResolvedAt(null);
    }

    const { error } = await (supabase as any)
      .from('chat_mensajes')
      .insert({
        chat_id: chatId,
        autor_id: user!.id,
        contenido: newMessage.trim(),
        tipo: 'mensaje',
      });

    if (error) {
      console.error('Error sending message:', error);
    } else {
      // Update chat timestamp to trigger admin realtime updates
      await (supabase as any).from('chats').update({
        fecha_actualizacion: new Date().toISOString(),
      }).eq('id', chatId);
      setNewMessage('');
    }
    setIsSending(false);
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

  if (!user || isAdmin) return null;

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => isOpen ? setIsOpen(false) : openChat()}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-foreground text-white rounded-full shadow-lg hover:bg-foreground/90 transition-all flex items-center justify-center"
        aria-label="Chat de soporte"
      >
        {isOpen ? <XIcon className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat window */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[28rem] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 bg-foreground text-white flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="font-medium text-sm">Soporte Softworks</h3>
                  <p className="text-[11px] opacity-80">Estamos para ayudarte</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm mt-8">
                    <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>¡Hola! ¿En qué podemos ayudarte?</p>
                    <p className="text-xs mt-1">Escribí tu consulta</p>
                  </div>
                ) : (
                  messages.map((msg) => (
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
                            <p className="text-[10px] font-medium text-gray-500 mb-0.5">Soporte</p>
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
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-2 border-t border-gray-200 flex-shrink-0">
                {isResolved && (
                  <p className="text-[10px] text-center text-gray-400 mb-1">✓ Consulta resuelta — escribí si necesitás más ayuda</p>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isResolved ? '¿Tenés otra consulta?' : 'Escribí tu mensaje...'}
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
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
