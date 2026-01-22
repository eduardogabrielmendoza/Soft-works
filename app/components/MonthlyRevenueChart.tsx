'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

interface MonthData {
  mes: string;
  pedidos: number;
  ingresos: number;
}

export default function MonthlyRevenueChart() {
  const [data, setData] = useState<MonthData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMonthlyData();
  }, []);

  const loadMonthlyData = async () => {
    setIsLoading(true);
    const supabase = getSupabaseClient();

    try {
      // Obtener pedidos de los últimos 12 meses
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

      // Agrupar por mes
      const monthlyStats: Record<string, { pedidos: number; ingresos: number }> = {};

      // Inicializar los últimos 12 meses
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      for (let i = 0; i < 12; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
        monthlyStats[monthKey] = { pedidos: 0, ingresos: 0 };
      }

      // Procesar pedidos
      orders?.forEach((order) => {
        const date = new Date(order.fecha_creacion);
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
        
        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].pedidos += 1;
          
          // Solo contar ingresos de pedidos aprobados, enviados o entregados
          if (['pago_aprobado', 'enviado', 'entregado'].includes(order.estado)) {
            monthlyStats[monthKey].ingresos += order.total;
          }
        }
      });

      // Convertir a array para el gráfico
      const chartData: MonthData[] = Object.entries(monthlyStats).map(([mes, stats]) => ({
        mes,
        pedidos: stats.pedidos,
        ingresos: Math.round(stats.ingresos),
      }));

      setData(chartData);
    } catch (error) {
      console.error('Error loading monthly data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-medium mb-4">Estadísticas Mensuales</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="mes" 
            tick={{ fontSize: 12 }}
            stroke="#888888"
          />
          <YAxis 
            yAxisId="left"
            orientation="left"
            stroke="#8884d8"
            tick={{ fontSize: 12 }}
            label={{ value: 'Pedidos', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#82ca9d"
            tick={{ fontSize: 12 }}
            label={{ value: 'Ingresos ($)', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'ingresos') {
                return [`$${value.toLocaleString()}`, 'Ingresos'];
              }
              return [value, 'Pedidos'];
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }}
            formatter={(value) => value === 'pedidos' ? 'Pedidos' : 'Ingresos'}
          />
          <Bar yAxisId="left" dataKey="pedidos" fill="#8884d8" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="ingresos" fill="#82ca9d" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
