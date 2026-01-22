'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  CheckCircle, 
  Clock, 
  XCircle,
  Truck,
  AlertCircle,
  Loader2,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  User
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { getSupabaseClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils/helpers';
import MonthlyRevenueChart from '@/app/components/MonthlyRevenueChart';

interface DashboardStats {
  totalOrders: number;
  pendingPayment: number;
  awaitingVerification: number;
  paymentApproved: number;
  shipped: number;
  delivered: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
}

export default function AdminDashboardPage() {
  const { user, profile, isAdmin, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos cuando el usuario sea admin
  useEffect(() => {
    if (!authLoading) {
      if (isAdmin) {
        loadDashboardData();
      } else {
        setIsLoading(false);
      }
    }
  }, [isAdmin, authLoading]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    const supabase = getSupabaseClient();

    try {
      // Get order stats (tabla: pedidos)
      const { data: orders, error: ordersError } = await supabase
        .from('pedidos')
        .select('id, estado, total');

      if (ordersError) {
        console.error('Error cargando pedidos:', ordersError);
      }
      console.log('Pedidos cargados:', orders?.length, orders);

      // Get recent orders (tabla: pedidos)
      const { data: recent, error: recentError } = await supabase
        .from('pedidos')
        .select('id, numero_pedido, estado, total, fecha_creacion, cliente_nombre, cliente_email')
        .order('fecha_creacion', { ascending: false })
        .limit(5);

      if (recentError) {
        console.error('Error cargando pedidos recientes:', recentError);
        console.error('Detalles:', JSON.stringify(recentError, null, 2));
      }
      console.log('Pedidos recientes cargados:', recent);

      setRecentOrders(recent || []);

      // Get products count (tabla: productos)
      const { count: productsCount } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true });

      // Get customers count (tabla: perfiles)
      const { count: customersCount } = await supabase
        .from('perfiles')
        .select('*', { count: 'exact', head: true });

      if (orders) {
        const pendingPayment = orders.filter((o: any) => o.estado === 'pendiente_pago').length;
        const awaitingVerification = orders.filter((o: any) => o.estado === 'esperando_verificacion').length;
        const paymentApproved = orders.filter((o: any) => o.estado === 'pago_aprobado').length;
        const shipped = orders.filter((o: any) => o.estado === 'enviado').length;
        const delivered = orders.filter((o: any) => o.estado === 'entregado').length;
        
        console.log('Stats:', { pendingPayment, awaitingVerification, paymentApproved, shipped, delivered });
        
        const totalRevenue = orders
          .filter((o: any) => ['pago_aprobado', 'enviado', 'entregado'].includes(o.estado))
          .reduce((sum: number, o: any) => sum + o.total, 0);

        setStats({
          totalOrders: orders.length,
          pendingPayment,
          awaitingVerification,
          paymentApproved,
          shipped,
          delivered,
          totalRevenue,
          totalProducts: productsCount || 0,
          totalCustomers: customersCount || 0,
        });
      }

      setRecentOrders(recent || []);
    } catch (error: any) {
      // Error cargando datos del dashboard
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string; icon: any }> = {
      pending_payment: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente', icon: Clock },
      awaiting_verification: { color: 'bg-blue-100 text-blue-800', label: 'Verificación', icon: AlertCircle },
      payment_approved: { color: 'bg-green-100 text-green-800', label: 'Aprobado', icon: CheckCircle },
      payment_rejected: { color: 'bg-red-100 text-red-800', label: 'Rechazado', icon: XCircle },
      shipped: { color: 'bg-purple-100 text-purple-800', label: 'Enviado', icon: Truck },
      delivered: { color: 'bg-gray-100 text-gray-800', label: 'Entregado', icon: CheckCircle },
    };
    const badge = badges[status] || { color: 'bg-gray-100 text-gray-800', label: status, icon: Package };
    const Icon = badge.icon;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  // Mostrar loading mientras se carga la autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
        <span className="mt-4 text-gray-600">Cargando...</span>
      </div>
    );
  }

  // Si hay usuario pero no perfil, mostrar loading
  if (user && !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
        <span className="mt-4 text-gray-600">Cargando perfil...</span>
      </div>
    );
  }

  // Si no hay usuario o no es admin, mostrar mensaje de acceso denegado
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-6">No tienes permisos para acceder a esta página.</p>
          <Link href="/" className="px-6 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors">
            Volver al Inicio
          </Link>
        </div>
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
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-medium flex items-center gap-3">
                <LayoutDashboard className="w-8 h-8" />
                Panel de Administración
              </h1>
              <p className="text-gray-500 mt-1">Bienvenido al dashboard de Softworks</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">Ingresos Totales</span>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{stats ? formatPrice(stats.totalRevenue) : '$0'}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">Total Pedidos</span>
                <ShoppingBag className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">Productos</span>
                <Package className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">{stats?.totalProducts || 0}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">Clientes</span>
                <Users className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-2xl font-bold">{stats?.totalCustomers || 0}</p>
            </div>
          </div>

          {/* Order Status Overview */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Link
              href="/admin/pedidos?status=esperando_verificacion"
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Esperando Verificación</p>
                  <p className="text-2xl font-bold text-blue-800">{stats?.awaitingVerification || 0}</p>
                </div>
              </div>
            </Link>
            <Link
              href="/admin/pedidos?status=pago_aprobado"
              className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">Listos para Enviar</p>
                  <p className="text-2xl font-bold text-green-800">{stats?.paymentApproved || 0}</p>
                </div>
              </div>
            </Link>
            <Link
              href="/admin/pedidos?status=enviado"
              className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Truck className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600">En Tránsito</p>
                  <p className="text-2xl font-bold text-purple-800">{stats?.shipped || 0}</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Monthly Revenue Chart */}
          <div className="mb-8">
            <MonthlyRevenueChart />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Orders */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Pedidos Recientes</h2>
                <Link href="/admin/pedidos" className="text-sm text-foreground hover:underline">
                  Ver todos →
                </Link>
              </div>
              {recentOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay pedidos todavía</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/pedidos/${order.id}`}
                      className="py-3 flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                    >
                      <div>
                        <p className="font-medium">{order.numero_pedido}</p>
                        <p className="text-sm text-gray-500">{order.cliente_nombre}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(order.estado)}
                        <span className="font-medium">{formatPrice(order.total)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium mb-4">Acciones Rápidas</h2>
              <div className="space-y-3">
                <Link
                  href="/admin/pedidos"
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <ShoppingBag className="w-5 h-5 text-gray-600" />
                  <span>Ver Pedidos</span>
                </Link>
                <Link
                  href="/admin/verificaciones"
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <CheckCircle className="w-5 h-5 text-gray-600" />
                  <span>Verificar Pagos</span>
                </Link>
                <Link
                  href="/admin/productos"
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Package className="w-5 h-5 text-gray-600" />
                  <span>Gestionar Productos</span>
                </Link>
                <Link
                  href="/admin/configuracion"
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <LayoutDashboard className="w-5 h-5 text-gray-600" />
                  <span>Configuración</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
