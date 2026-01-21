'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertCircle,
  Eye,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getSupabaseClient } from '@/lib/supabase/client';
import { formatPrice, formatDateTime, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils/helpers';

const ORDER_STATUSES = [
  { value: '', label: 'Todos' },
  { value: 'pendiente_pago', label: 'Pendiente de Pago' },
  { value: 'esperando_verificacion', label: 'Esperando Verificación' },
  { value: 'pago_aprobado', label: 'Pago Aprobado' },
  { value: 'pago_rechazado', label: 'Pago Rechazado' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
];

function AdminPedidosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status') || '';
  const { isAdmin, isLoading: authLoading } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const ordersPerPage = 15;

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/cuenta');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      loadOrders();
    }
  }, [isAdmin, statusFilter, currentPage, searchQuery]);

  const loadOrders = async () => {
    setIsLoading(true);
    const supabase = getSupabaseClient();

    try {
      let query = supabase
        .from('pedidos')
        .select('id, numero_pedido, estado, total, fecha_creacion, cliente_nombre, cliente_email, direccion_envio', { count: 'exact' });

      if (statusFilter && statusFilter.trim() !== '') {
        query = query.eq('estado', statusFilter);
      }

      if (searchQuery && searchQuery.trim() !== '') {
        query = query.or(`numero_pedido.ilike.%${searchQuery}%,cliente_nombre.ilike.%${searchQuery}%,cliente_email.ilike.%${searchQuery}%`);
      }

      query = query
        .order('fecha_creacion', { ascending: false })
        .range((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage - 1);

      const { data, count, error } = await query;

      if (error) {
        console.error('Error cargando pedidos:', error.message || error);
        throw error;
      }

      setOrders(data || []);
      setTotalPages(Math.ceil((count || 0) / ordersPerPage));
    } catch (error: any) {
      console.error('Error cargando pedidos:', error?.message || error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    router.push(`/admin/pedidos?${params.toString()}`);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadOrders();
  };

  const handleDeleteOrder = async (orderId: string) => {
    setActionLoading(orderId);
    const supabase = getSupabaseClient();
    
    try {
      // Primero eliminar los items del pedido
      await supabase
        .from('pedido_items')
        .delete()
        .eq('pedido_id', orderId);

      // Luego eliminar el pedido
      const { error } = await supabase
        .from('pedidos')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      
      setShowDeleteModal(null);
      loadOrders();
    } catch (error) {
      console.error('Error eliminando pedido:', error);
      alert('Error al eliminar el pedido');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      pendiente_pago: Clock,
      esperando_verificacion: AlertCircle,
      pago_aprobado: CheckCircle,
      pago_rechazado: XCircle,
      enviado: Truck,
      entregado: CheckCircle,
      cancelado: XCircle,
    };
    const Icon = icons[status] || Package;
    return <Icon className="w-4 h-4" />;
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
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link
                href="/admin"
                className="text-sm text-gray-500 hover:text-foreground flex items-center gap-1 mb-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver al Dashboard
              </Link>
              <h1 className="text-2xl lg:text-3xl font-medium">Gestión de Pedidos</h1>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por número, nombre o email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>
              </form>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-foreground" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No se encontraron pedidos
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Pedido</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Cliente</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Estado</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Total</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Fecha</th>
                      <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/pedidos/${order.id}`}
                            className="font-medium hover:underline"
                          >
                            {order.numero_pedido}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{order.cliente_nombre}</p>
                            <p className="text-sm text-gray-500">{order.cliente_email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.estado)}`}>
                            {getStatusIcon(order.estado)}
                            {getOrderStatusLabel(order.estado)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{formatPrice(order.total)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDateTime(order.fecha_creacion)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Link
                              href={`/admin/pedidos/${order.id}`}
                              className="p-2 text-gray-600 hover:text-foreground hover:bg-gray-100 rounded-md transition-colors"
                              title="Ver pedido"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => setShowDeleteModal(order.id)}
                              disabled={actionLoading === order.id}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                              title="Eliminar pedido"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg max-w-md w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-medium">Eliminar Pedido</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que querés eliminar este pedido? Esta acción no se puede deshacer y se eliminarán todos los datos asociados.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(null)}
                disabled={actionLoading !== null}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteOrder(showDeleteModal)}
                disabled={actionLoading !== null}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading === showDeleteModal ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function AdminPedidosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center pt-20">
          <Loader2 className="w-8 h-8 animate-spin text-foreground" />
        </div>
      }
    >
      <AdminPedidosContent />
    </Suspense>
  );
}
