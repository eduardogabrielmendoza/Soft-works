'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Loader2, TrendingUp, TrendingDown, ShoppingBag, DollarSign, Calendar, X, Package, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MonthData {
  mes: string;
  mesCompleto: string;
  pedidos: number;
  ingresos: number;
  pedidosAprobados: number;
  pedidosEnviados: number;
  pedidosEntregados: number;
  pedidosPendientes: number;
  ticketPromedio: number;
}

interface OrderDetail {
  id: string;
  numero_pedido: string;
  total: number;
  estado: string;
  fecha_creacion: string;
  cliente_nombre: string;
}

export default function MonthlyRevenueChart() {
  const [data, setData] = useState<MonthData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<MonthData | null>(null);
  const [monthOrders, setMonthOrders] = useState<OrderDetail[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    loadMonthlyData();
  }, []);

  const loadMonthlyData = async () => {
    setIsLoading(true);
    const supabase = getSupabaseClient();

    try {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
      twelveMonthsAgo.setDate(1);
      twelveMonthsAgo.setHours(0, 0, 0, 0);

      const { data: orders, error } = await supabase
        .from('pedidos')
        .select('fecha_creacion, total, estado')
        .gte('fecha_creacion', twelveMonthsAgo.toISOString())
        .order('fecha_creacion', { ascending: true });

      if (error) throw error;

      const monthlyStats: Record<string, { 
        pedidos: number; 
        ingresos: number;
        pedidosAprobados: number;
        pedidosEnviados: number;
        pedidosEntregados: number;
        pedidosPendientes: number;
        mesCompleto: string;
      }> = {};

      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const monthsFull = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      
      for (let i = 0; i < 12; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
        monthlyStats[monthKey] = { 
          pedidos: 0, 
          ingresos: 0,
          pedidosAprobados: 0,
          pedidosEnviados: 0,
          pedidosEntregados: 0,
          pedidosPendientes: 0,
          mesCompleto: `${monthsFull[date.getMonth()]} ${date.getFullYear()}`
        };
      }

      orders?.forEach((order: any) => {
        const date = new Date(order.fecha_creacion);
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
        
        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].pedidos += 1;
          
          if (order.estado === 'pago_aprobado') {
            monthlyStats[monthKey].pedidosAprobados += 1;
            monthlyStats[monthKey].ingresos += order.total;
          } else if (order.estado === 'enviado') {
            monthlyStats[monthKey].pedidosEnviados += 1;
            monthlyStats[monthKey].ingresos += order.total;
          } else if (order.estado === 'entregado') {
            monthlyStats[monthKey].pedidosEntregados += 1;
            monthlyStats[monthKey].ingresos += order.total;
          } else {
            monthlyStats[monthKey].pedidosPendientes += 1;
          }
        }
      });

      const chartData: MonthData[] = Object.entries(monthlyStats).map(([mes, stats]) => ({
        mes,
        mesCompleto: stats.mesCompleto,
        pedidos: stats.pedidos,
        ingresos: Math.round(stats.ingresos),
        pedidosAprobados: stats.pedidosAprobados,
        pedidosEnviados: stats.pedidosEnviados,
        pedidosEntregados: stats.pedidosEntregados,
        pedidosPendientes: stats.pedidosPendientes,
        ticketPromedio: stats.pedidos > 0 ? Math.round(stats.ingresos / stats.pedidos) : 0,
      }));

      setData(chartData);
    } catch (error) {
      console.error('Error loading monthly data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMonthOrders = async (monthData: MonthData) => {
    setLoadingOrders(true);
    setSelectedMonth(monthData);
    const supabase = getSupabaseClient();

    try {
      // Parsear mes y año del formato "Ene 25"
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const [mesAbrev, yearShort] = monthData.mes.split(' ');
      const monthIndex = months.indexOf(mesAbrev);
      const year = 2000 + parseInt(yearShort);

      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59);

      const { data: orders, error } = await supabase
        .from('pedidos')
        .select('id, numero_pedido, total, estado, fecha_creacion, cliente_nombre')
        .gte('fecha_creacion', startDate.toISOString())
        .lte('fecha_creacion', endDate.toISOString())
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      setMonthOrders(orders || []);
    } catch (error) {
      console.error('Error loading month orders:', error);
      setMonthOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleBarClick = (data: any, index: number) => {
    if (data && data.payload) {
      loadMonthOrders(data.payload);
    }
  };

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      'pendiente_pago': 'bg-yellow-100 text-yellow-800',
      'esperando_verificacion': 'bg-orange-100 text-orange-800',
      'pago_aprobado': 'bg-green-100 text-green-800',
      'enviado': 'bg-blue-100 text-blue-800',
      'entregado': 'bg-emerald-100 text-emerald-800',
      'cancelado': 'bg-red-100 text-red-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      'pendiente_pago': 'Pendiente',
      'esperando_verificacion': 'Verificando',
      'pago_aprobado': 'Aprobado',
      'enviado': 'Enviado',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado',
    };
    return labels[estado] || estado;
  };

  // Calcular tendencias
  const currentMonth = data[data.length - 1];
  const previousMonth = data[data.length - 2];
  const ingresosTrend = currentMonth && previousMonth && previousMonth.ingresos > 0
    ? ((currentMonth.ingresos - previousMonth.ingresos) / previousMonth.ingresos * 100).toFixed(1)
    : '0';
  const pedidosTrend = currentMonth && previousMonth && previousMonth.pedidos > 0
    ? ((currentMonth.pedidos - previousMonth.pedidos) / previousMonth.pedidos * 100).toFixed(1)
    : '0';

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Ingresos Este Mes</p>
              <p className="text-2xl font-bold">${currentMonth?.ingresos.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            {parseFloat(ingresosTrend) >= 0 ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1" />
            )}
            <span>{ingresosTrend}% vs mes anterior</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Pedidos Este Mes</p>
              <p className="text-2xl font-bold">{currentMonth?.pedidos || 0}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            {parseFloat(pedidosTrend) >= 0 ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1" />
            )}
            <span>{pedidosTrend}% vs mes anterior</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Ticket Promedio</p>
              <p className="text-2xl font-bold">${currentMonth?.ticketPromedio.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <span>Por pedido aprobado</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Entregados</p>
              <p className="text-2xl font-bold">{currentMonth?.pedidosEntregados || 0}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <span>Este mes completados</span>
          </div>
        </motion.div>
      </div>

      {/* Gráfico principal */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Estadísticas Mensuales</h2>
          <p className="text-sm text-gray-500">Haz clic en una barra para ver detalles</p>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart 
            data={data}
            onMouseMove={(state) => {
              if (state?.activeTooltipIndex !== undefined && typeof state.activeTooltipIndex === 'number') {
                setActiveIndex(state.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis 
              dataKey="mes" 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              stroke="#e5e7eb"
              tickLine={false}
            />
            <YAxis 
              yAxisId="left"
              orientation="left"
              stroke="#8b5cf6"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#10b981"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                padding: '16px'
              }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const monthData = payload[0].payload as MonthData;
                  return (
                    <div className="bg-white rounded-xl shadow-xl p-4 min-w-[200px]">
                      <p className="font-semibold text-gray-900 mb-3">{monthData.mesCompleto}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ingresos:</span>
                          <span className="font-medium text-emerald-600">${monthData.ingresos.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Pedidos:</span>
                          <span className="font-medium text-purple-600">{monthData.pedidos}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between">
                          <span className="text-gray-600">Aprobados:</span>
                          <span className="text-green-600">{monthData.pedidosAprobados}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Enviados:</span>
                          <span className="text-blue-600">{monthData.pedidosEnviados}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Entregados:</span>
                          <span className="text-emerald-600">{monthData.pedidosEntregados}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pendientes:</span>
                          <span className="text-orange-600">{monthData.pedidosPendientes}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ticket Promedio:</span>
                          <span className="font-medium">${monthData.ticketPromedio.toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-3 text-center">Clic para ver pedidos</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => (
                <span className="text-sm text-gray-600">
                  {value === 'pedidos' ? 'Pedidos' : 'Ingresos'}
                </span>
              )}
            />
            <Bar 
              yAxisId="left" 
              dataKey="pedidos" 
              radius={[6, 6, 0, 0]}
              onClick={handleBarClick}
              cursor="pointer"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-pedidos-${index}`} 
                  fill={activeIndex === index ? '#7c3aed' : '#8b5cf6'}
                />
              ))}
            </Bar>
            <Bar 
              yAxisId="right" 
              dataKey="ingresos" 
              radius={[6, 6, 0, 0]}
              onClick={handleBarClick}
              cursor="pointer"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-ingresos-${index}`} 
                  fill={activeIndex === index ? '#059669' : '#10b981'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Modal de detalles del mes */}
      <AnimatePresence>
        {selectedMonth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedMonth(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del modal */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{selectedMonth.mesCompleto}</h3>
                    <p className="text-purple-100 mt-1">Detalle de pedidos del mes</p>
                  </div>
                  <button 
                    onClick={() => setSelectedMonth(null)}
                    className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Stats del mes */}
                <div className="grid grid-cols-4 gap-4 mt-6">
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{selectedMonth.pedidos}</p>
                    <p className="text-xs text-purple-100">Pedidos</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">${(selectedMonth.ingresos / 1000).toFixed(1)}k</p>
                    <p className="text-xs text-purple-100">Ingresos</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">${selectedMonth.ticketPromedio}</p>
                    <p className="text-xs text-purple-100">Ticket Prom.</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{selectedMonth.pedidosEntregados}</p>
                    <p className="text-xs text-purple-100">Entregados</p>
                  </div>
                </div>
              </div>

              {/* Lista de pedidos */}
              <div className="p-6 overflow-y-auto max-h-[400px]">
                {loadingOrders ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : monthOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No hay pedidos en este mes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {monthOrders.map((order, index) => (
                      <motion.a
                        key={order.id}
                        href={`/admin/pedidos/${order.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-gray-100 group-hover:bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center transition-colors">
                            <Package className="w-5 h-5 text-gray-600 group-hover:text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">#{order.numero_pedido}</p>
                            <p className="text-sm text-gray-500">{order.cliente_nombre}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">${order.total.toLocaleString()}</p>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${getEstadoColor(order.estado)}`}>
                              {getEstadoLabel(order.estado)}
                            </span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                        </div>
                      </motion.a>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
