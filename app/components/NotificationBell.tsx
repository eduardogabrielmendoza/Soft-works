'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Check, X as XIcon, Loader2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';

interface Notification {
  id: string;
  usuario_id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  metadata: Record<string, unknown> | null;
  leida: boolean;
  fecha_creacion: string;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refresh } = useNotifications();
  const { isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [mobileTop, setMobileTop] = useState(64);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  const recentNotifs = notifications.slice(0, 10);

  const handleAdminAction = async (notifId: string, action: 'aprobar' | 'rechazar', solicitudId?: string, solicitudEmail?: string) => {
    setProcessingId(notifId);
    try {
      let resolvedId = solicitudId;

      // If no solicitudId in metadata, find it by email
      if (!resolvedId && solicitudEmail) {
        const findRes = await fetch(`/api/auth/admin-reset-find?email=${encodeURIComponent(solicitudEmail)}`);
        const findData = await findRes.json();
        resolvedId = findData.solicitudId;
      }

      if (!resolvedId) {
        await markAsRead(notifId);
        await refresh();
        return;
      }

      const res = await fetch('/api/auth/admin-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitudId: resolvedId, action }),
      });

      if (res.ok) {
        await markAsRead(notifId);
        await refresh();
      }
    } catch (err) {
      console.error('Error processing admin action:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin}m`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Hace ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    return `Hace ${diffD}d`;
  };

  const openNotification = (notif: Notification) => {
    if (!notif.leida) markAsRead(notif.id);
    setSelectedNotif(notif);
    setIsOpen(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        onClick={() => {
          if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMobileTop(rect.bottom + 8);
          }
          setIsOpen(!isOpen);
        }}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Desktop dropdown - stays inside the header for proper positioning */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="hidden lg:block absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-[60] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-medium text-sm">Notificaciones</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-xs text-gray-500 hover:text-black transition-colors"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto overscroll-contain">
              {recentNotifs.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                  No tenés notificaciones
                </div>
              ) : (
                recentNotifs.map((notif) => {
                  const isRecoveryRequest = isAdmin && notif.metadata?.solicitud_tipo === 'recuperacion';
                  const solicitudEmail = notif.metadata?.usuario_email as string | undefined;
                  const solicitudId = notif.metadata?.solicitud_id as string | undefined;
                  const isProcessing = processingId === notif.id;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => openNotification(notif)}
                      className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notif.leida ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {!notif.leida && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                        )}
                        <div className={!notif.leida ? '' : 'ml-5'}>
                          <p className="text-sm font-medium text-gray-900">{notif.titulo}</p>
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notif.mensaje}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{formatTime(notif.fecha_creacion)}</p>
                          {isRecoveryRequest && (solicitudId || solicitudEmail) && !notif.leida && (
                            <div className="flex gap-2 mt-2">
                              {isProcessing ? (
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleAdminAction(notif.id, 'aprobar', solicitudId, solicitudEmail);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                  >
                                    <Check className="w-3 h-3" />
                                    Aprobar
                                  </button>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleAdminAction(notif.id, 'rechazar', solicitudId, solicitudEmail);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                  >
                                    <XIcon className="w-3 h-3" />
                                    Rechazar
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Mobile dropdown - portaled to body to escape header stacking context */}
    {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        {isOpen && (
          <>
          <div className="fixed inset-0 bg-black/20 z-[59] lg:hidden" onClick={() => setIsOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{ top: mobileTop }}
            className="fixed inset-x-3 max-h-[calc(100vh-80px)] bg-white rounded-lg shadow-xl border border-gray-200 z-[60] overflow-hidden lg:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-medium text-sm">Notificaciones</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-xs text-gray-500 hover:text-black transition-colors"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto overscroll-contain">
              {recentNotifs.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                  No tenés notificaciones
                </div>
              ) : (
                recentNotifs.map((notif) => {
                  const isRecoveryRequest = isAdmin && notif.metadata?.solicitud_tipo === 'recuperacion';
                  const solicitudEmail = notif.metadata?.usuario_email as string | undefined;
                  const solicitudId = notif.metadata?.solicitud_id as string | undefined;
                  const isProcessing = processingId === notif.id;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => openNotification(notif)}
                      className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notif.leida ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {!notif.leida && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                        )}
                        <div className={!notif.leida ? '' : 'ml-5'}>
                          <p className="text-sm font-medium text-gray-900">{notif.titulo}</p>
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notif.mensaje}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{formatTime(notif.fecha_creacion)}</p>
                          {isRecoveryRequest && (solicitudId || solicitudEmail) && !notif.leida && (
                            <div className="flex gap-2 mt-2">
                              {isProcessing ? (
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleAdminAction(notif.id, 'aprobar', solicitudId, solicitudEmail);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                  >
                                    <Check className="w-3 h-3" />
                                    Aprobar
                                  </button>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleAdminAction(notif.id, 'rechazar', solicitudId, solicitudEmail);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                  >
                                    <XIcon className="w-3 h-3" />
                                    Rechazar
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    )}

    {/* Notification Detail Modal - rendered via portal to escape Navbar stacking context */}
    {typeof document !== 'undefined' && createPortal(
    <AnimatePresence>
      {selectedNotif && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedNotif(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg max-w-lg w-full p-6 relative max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedNotif(null)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div className="pr-8">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  selectedNotif.tipo === 'pedido' ? 'bg-blue-100 text-blue-700' :
                  selectedNotif.tipo === 'admin' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedNotif.tipo === 'pedido' ? 'Pedido' : selectedNotif.tipo === 'admin' ? 'Admin' : 'Sistema'}
                </span>
                <span className="text-xs text-gray-400">{formatDate(selectedNotif.fecha_creacion)}</span>
              </div>

              <h2 className="text-xl font-medium mt-3 mb-4">{selectedNotif.titulo}</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedNotif.mensaje}</p>

              {/* Action URL link */}
              {!!selectedNotif.metadata?.action_url && (
                <Link
                  href={String(selectedNotif.metadata.action_url)}
                  onClick={() => setSelectedNotif(null)}
                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-foreground text-white text-sm rounded-md hover:bg-foreground/90 transition-colors"
                >
                  Ver detalle
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}

              {/* Admin recovery actions in modal */}
              {!!(isAdmin && selectedNotif.metadata?.solicitud_tipo === 'recuperacion') && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">Acciones de administrador</p>
                  {!!selectedNotif.metadata.usuario_email && (
                    <p className="text-xs text-gray-500 mb-3">
                      Email: {String(selectedNotif.metadata.usuario_email)}
                    </p>
                  )}
                  <div className="flex gap-3">
                    {processingId === selectedNotif.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : (
                      <>
                        <button
                          onClick={async () => {
                            await handleAdminAction(
                              selectedNotif.id,
                              'aprobar',
                              selectedNotif.metadata?.solicitud_id as string | undefined,
                              selectedNotif.metadata?.usuario_email as string | undefined
                            );
                            setSelectedNotif(null);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          Aprobar Solicitud
                        </button>
                        <button
                          onClick={async () => {
                            await handleAdminAction(
                              selectedNotif.id,
                              'rechazar',
                              selectedNotif.metadata?.solicitud_id as string | undefined,
                              selectedNotif.metadata?.usuario_email as string | undefined
                            );
                            setSelectedNotif(null);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          <XIcon className="w-4 h-4" />
                          Rechazar Solicitud
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Order metadata */}
              {!!selectedNotif.metadata?.numero_pedido && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Pedido: #{String(selectedNotif.metadata.numero_pedido)}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
    )}
    </>
  );
}
