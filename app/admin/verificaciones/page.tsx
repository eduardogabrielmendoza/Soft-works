'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, 
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  ExternalLink,
  FileImage,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getSupabaseClient } from '@/lib/supabase/client';
import { approvePayment, rejectPayment } from '@/lib/api/orders';
import { formatPrice, formatDateTime } from '@/lib/utils/helpers';

interface PendingVerification {
  id: string;
  pedido_id: string;
  comprobante_url: string;
  referencia_transferencia: string | null;
  fecha_transferencia: string | null;
  monto_transferido: number | null;
  notas_cliente: string | null;
  enviado_el: string;
  pedido: {
    id: string;
    numero_pedido: string;
    total: number;
    nombre_cliente: string;
    email_cliente: string;
  };
}

export default function AdminVerificacionesPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();

  const [verifications, setVerifications] = useState<PendingVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/cuenta');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (!authLoading) {
      if (isAdmin) {
        loadVerifications();
      } else {
        setIsLoading(false);
      }
    }
  }, [isAdmin, authLoading]);

  const loadVerifications = async () => {
    setIsLoading(true);
    const supabase = getSupabaseClient();

    try {
      const { data, error } = await supabase
        .from('verificaciones_pago')
        .select(`
          id,
          pedido_id,
          comprobante_url,
          referencia_transferencia,
          fecha_transferencia,
          monto_transferido,
          notas_cliente,
          enviado_el,
          pedido:pedidos!inner (
            id,
            numero_pedido,
            total,
            nombre_cliente,
            email_cliente
          )
        `)
        .eq('estado', 'pendiente')
        .order('enviado_el', { ascending: true });

      if (error) {
        console.error('Error cargando verificaciones:', error);
        throw error;
      }

      // Transform data to flatten order relation
      const transformed = (data || []).map((v: any) => ({
        ...v,
        pedido: Array.isArray(v.pedido) ? v.pedido[0] : v.pedido
      }));

      setVerifications(transformed);
    } catch (error: any) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (verificationId: string) => {
    setProcessingId(verificationId);
    try {
      await approvePayment(verificationId);
      await loadVerifications();
    } catch (error: any) {
      alert('Error al aprobar el pago');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!showRejectModal || !rejectionReason) return;
    
    setProcessingId(showRejectModal);
    try {
      await rejectPayment(showRejectModal, rejectionReason);
      setShowRejectModal(null);
      setRejectionReason('');
      await loadVerifications();
    } catch (error: any) {
      alert('Error al rechazar el pago');
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin"
              className="text-sm text-gray-500 hover:text-foreground flex items-center gap-1 mb-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Volver al Dashboard
            </Link>
            <h1 className="text-2xl lg:text-3xl font-medium flex items-center gap-3">
              <AlertCircle className="w-8 h-8" />
              Verificación de Pagos
            </h1>
            <p className="text-gray-500 mt-1">
              {verifications.length} {verifications.length === 1 ? 'pago pendiente' : 'pagos pendientes'} de verificación
            </p>
          </div>

          {/* Verifications List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-foreground" />
            </div>
          ) : verifications.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-medium mb-2">¡Todo al día!</h2>
              <p className="text-gray-500">No hay pagos pendientes de verificación</p>
            </div>
          ) : (
            <div className="space-y-4">
              {verifications.map((verification) => (
                <div
                  key={verification.id}
                  className="bg-white rounded-lg border border-gray-200 p-6"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Receipt Preview */}
                    <div className="lg:w-48 flex-shrink-0">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        {verification.comprobante_url ? (
                          <a
                            href={verification.comprobante_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full h-full relative group"
                          >
                            <img
                              src={verification.comprobante_url}
                              alt="Comprobante"
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ExternalLink className="w-8 h-8 text-white" />
                            </div>
                          </a>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileImage className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <Link
                            href={`/admin/pedidos/${verification.pedido_id}`}
                            className="text-lg font-medium hover:underline"
                          >
                            {verification.pedido.numero_pedido}
                          </Link>
                          <p className="text-sm text-gray-500">
                            {verification.pedido.nombre_cliente} - {verification.pedido.email_cliente}
                          </p>
                        </div>
                        <Link
                          href={`/admin/pedidos/${verification.pedido_id}`}
                          className="text-sm text-foreground hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Ver pedido
                        </Link>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Monto del Pedido</p>
                          <p className="text-lg font-bold">{formatPrice(verification.pedido.total)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Monto Declarado</p>
                          <p className={`text-lg font-bold ${
                            verification.monto_transferido !== verification.pedido.total
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}>
                            {verification.monto_transferido
                              ? formatPrice(verification.monto_transferido)
                              : 'No indicado'}
                          </p>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1 mb-4">
                        {verification.referencia_transferencia && (
                          <p>
                            <span className="font-medium">Referencia:</span> {verification.referencia_transferencia}
                          </p>
                        )}
                        {verification.fecha_transferencia && (
                          <p>
                            <span className="font-medium">Fecha:</span> {verification.fecha_transferencia}
                          </p>
                        )}
                        {verification.notas_cliente && (
                          <p>
                            <span className="font-medium">Notas:</span> {verification.notas_cliente}
                          </p>
                        )}
                        <p className="text-gray-400">
                          Subido: {formatDateTime(verification.enviado_el)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(verification.id)}
                          disabled={processingId === verification.id}
                          className="flex-1 sm:flex-none px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {processingId === verification.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              Aprobar
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setShowRejectModal(verification.id)}
                          disabled={processingId === verification.id}
                          className="flex-1 sm:flex-none px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-5 h-5" />
                          Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reject Modal */}
          {showRejectModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-lg max-w-md w-full p-6"
              >
                <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
                  <XCircle className="w-6 h-6 text-red-600" />
                  Rechazar Pago
                </h3>
                <p className="text-gray-600 mb-4">
                  Ingresá el motivo del rechazo. El cliente recibirá esta información.
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none mb-4"
                  placeholder="Ej: El monto no coincide, comprobante ilegible, etc."
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(null);
                      setRejectionReason('');
                    }}
                    className="flex-1 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={!rejectionReason || processingId === showRejectModal}
                    className="flex-1 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processingId === showRejectModal ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Confirmar Rechazo'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
