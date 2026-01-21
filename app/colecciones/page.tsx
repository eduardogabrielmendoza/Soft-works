'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { SlidersHorizontal, X, Loader2 } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Producto {
  id: string;
  nombre: string;
  slug: string;
  precio: number;
  precio_comparacion: number | null;
  categoria: string;
  color: string | null;
  activo: boolean;
  destacado: boolean;
  stock: Record<string, number>;
  imagenes: { src: string; etiqueta: string }[];
}

export default function ColeccionesPage() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [products, setProducts] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar productos desde Supabase
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    const supabase = getSupabaseClient();

    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true) // Solo productos activos
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch {
      // Error cargando productos - silencioso
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular stock total de un producto
  const getTotalStock = (stock: Record<string, number>) => {
    if (!stock) return 0;
    return Object.values(stock).reduce((sum, qty) => sum + qty, 0);
  };

  // Verificar si un producto está agotado
  const isOutOfStock = (product: Producto) => {
    return getTotalStock(product.stock) === 0;
  };

  // Obtener colores únicos de los productos
  const uniqueColors = [...new Set(products.map(p => p.color).filter(Boolean))];

  const categories = [
    { value: 'all', label: 'Todas' },
    { value: 'camisetas', label: 'Camisetas' },
    { value: 'hoodies', label: 'Hoodies' },
    { value: 'gorras', label: 'Gorras' },
    { value: 'accesorios', label: 'Accesorios' },
  ];

  const colors = [
    { value: 'all', label: 'Todos' },
    ...uniqueColors.map(color => ({ value: color!, label: color! }))
  ];

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchCategory = selectedCategory === 'all' || product.categoria === selectedCategory;
    const matchColor = selectedColor === 'all' || product.color === selectedColor;
    return matchCategory && matchColor;
  });

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedColor('all');
  };

  // Obtener imagen principal del producto
  const getMainImage = (product: Producto) => {
    if (product.imagenes && product.imagenes.length > 0) {
      return product.imagenes[0].src;
    }
    return '/images/placeholder.png';
  };

  // Calcular descuento
  const getDiscount = (product: Producto) => {
    if (product.precio_comparacion && product.precio_comparacion > product.precio) {
      return Math.round((1 - product.precio / product.precio_comparacion) * 100);
    }
    return 0;
  };

  if (isLoading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="pt-20">
      {/* Header */}
      <div className="px-4 py-12 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl lg:text-4xl font-medium mb-4">Colecciones</h1>
          <div className="flex items-center justify-between">
            <p className="text-foreground/70">{filteredProducts.length} {filteredProducts.length === 1 ? 'prenda' : 'prendas'}</p>
            <button 
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm">Filtros</span>
            </button>
          </div>
        </motion.div>

        {/* Panel de Filtros */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-6"
            >
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-medium">Filtrar por</h3>
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-4">
                  {/* Categorías */}
                  <div>
                    <label className="text-sm font-medium block mb-3">Categoría</label>
                    <div className="space-y-2">
                      {categories.map((cat) => (
                        <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="category"
                            value={cat.value}
                            checked={selectedCategory === cat.value}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{cat.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Colores */}
                  <div>
                    <label className="text-sm font-medium block mb-3">Color</label>
                    <div className="space-y-2">
                      {colors.map((col) => (
                        <label key={col.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="color"
                            value={col.value}
                            checked={selectedColor === col.value}
                            onChange={(e) => setSelectedColor(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{col.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={resetFilters}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md hover:bg-white transition-colors text-sm"
                  >
                    Limpiar filtros
                  </button>
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="flex-1 py-2 px-4 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors text-sm"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid de productos */}
      <div className="px-4 pb-16 max-w-7xl mx-auto">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-foreground/70">No se encontraron productos con los filtros seleccionados.</p>
            <button
              onClick={resetFilters}
              className="mt-4 text-sm underline hover:text-foreground/70 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {filteredProducts.map((product, index) => {
              const outOfStock = isOutOfStock(product);
              const discount = getDiscount(product);
              
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Link 
                    href={`/producto/${product.slug}`} 
                    className={`group block ${outOfStock ? 'opacity-75' : ''}`}
                  >
                    <div className="aspect-[3/4] rounded-lg mb-3 relative overflow-hidden bg-gray-100">
                      {product.imagenes && product.imagenes.length > 0 ? (
                        <Image
                          src={getMainImage(product)}
                          alt={product.nombre}
                          fill
                          className={`object-cover group-hover:scale-105 transition-transform duration-500 ${outOfStock ? 'grayscale' : ''}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          Sin imagen
                        </div>
                      )}
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {outOfStock && (
                          <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-medium">
                            Agotado
                          </span>
                        )}
                        {discount > 0 && !outOfStock && (
                          <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs font-medium">
                            -{discount}%
                          </span>
                        )}
                        {product.destacado && !outOfStock && (
                          <span className="px-2 py-1 bg-foreground text-white rounded-full text-xs font-medium">
                            Destacado
                          </span>
                        )}
                      </div>
                      
                      {product.color && (
                        <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs">
                          {product.color}
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-sm font-medium mb-1 group-hover:text-foreground/70 transition-colors">
                      {product.nombre}
                    </h3>
                    
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-foreground/70">
                        ${product.precio.toLocaleString('es-AR')}
                      </p>
                      {product.precio_comparacion && product.precio_comparacion > product.precio && (
                        <p className="text-sm text-gray-400 line-through">
                          ${product.precio_comparacion.toLocaleString('es-AR')}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
