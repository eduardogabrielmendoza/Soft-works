'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Loader2,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { getSupabaseClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils/helpers';

interface Product {
  id: string;
  nombre: string;
  slug: string;
  precio: number;
  categoria: string;
  activo: boolean;
  destacado: boolean;
  stock: Record<string, number>;
  imagenes: { src: string; etiqueta: string }[];
}

export default function ProductosAdminPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && isAdmin) {
      loadProducts();
    } else if (!authLoading && !isAdmin) {
      setIsLoading(false);
    }
  }, [isAdmin, authLoading]);

  const loadProducts = async () => {
    setIsLoading(true);
    const supabase = getSupabaseClient();

    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      // Error cargando productos
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    const supabase = getSupabaseClient();
    
    try {
      const { error } = await supabase
        .from('productos')
        .update({ activo: !currentStatus })
        .eq('id', productId);

      if (error) throw error;
      
      // Actualizar localmente
      setProducts(products.map(p => 
        p.id === productId ? { ...p, activo: !currentStatus } : p
      ));
    } catch (error: any) {
      alert('Error al actualizar el estado del producto');
    }
  };

  const toggleProductFeatured = async (productId: string, currentFeatured: boolean) => {
    const supabase = getSupabaseClient();
    
    try {
      const { error } = await supabase
        .from('productos')
        .update({ destacado: !currentFeatured })
        .eq('id', productId);

      if (error) throw error;
      
      // Actualizar localmente
      setProducts(products.map(p => 
        p.id === productId ? { ...p, destacado: !currentFeatured } : p
      ));
    } catch (error: any) {
      alert('Error al actualizar producto destacado');
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;

    const supabase = getSupabaseClient();
    
    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      // Actualizar localmente
      setProducts(products.filter(p => p.id !== productId));
    } catch (error: any) {
      alert('Error al eliminar el producto');
    }
  };

  const getTotalStock = (stock: Record<string, number>) => {
    return Object.values(stock).reduce((sum, qty) => sum + qty, 0);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.categoria === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <p>No tienes permisos para acceder a esta página.</p>
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-medium flex items-center gap-3">
                <Package className="w-8 h-8" />
                Gestión de Productos
              </h1>
              <p className="text-gray-600 mt-2">Administra tu catálogo de productos</p>
            </div>
            <Link
              href="/admin/productos/nuevo"
              className="px-4 py-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nuevo Producto
            </Link>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
            >
              <option value="all">Todas las categorías</option>
              <option value="camisetas">Camisetas</option>
              <option value="hoodies">Hoodies</option>
              <option value="gorras">Gorras</option>
              <option value="accesorios">Accesorios</option>
            </select>
          </div>

          {/* Products Table */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-foreground" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos</h3>
              <p className="text-gray-600 mb-6">Comienza agregando tu primer producto</p>
              <Link
                href="/admin/productos/nuevo"
                className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Crear Producto
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.imagenes[0] ? (
                            <img
                              src={product.imagenes[0].src}
                              alt={product.nombre}
                              className="w-12 h-12 rounded-md object-cover mr-3"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-md mr-3 flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{product.nombre}</div>
                            <div className="text-sm text-gray-500">{product.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 capitalize">
                          {product.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(product.precio)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getTotalStock(product.stock)} unidades
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => toggleProductStatus(product.id, product.activo)}
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              product.activo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.activo ? 'Activo' : 'Inactivo'}
                          </button>
                          {product.destacado && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                              Destacado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleProductFeatured(product.id, product.destacado)}
                            className="p-2 text-gray-600 hover:text-yellow-600 transition-colors"
                            title={product.destacado ? 'Quitar de destacados' : 'Marcar como destacado'}
                          >
                            {product.destacado ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <Link
                            href={`/admin/productos/${product.id}/editar`}
                            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                            title="Eliminar"
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
        </motion.div>
      </div>
    </div>
  );
}
