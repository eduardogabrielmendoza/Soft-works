'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { getSupabaseClient } from '@/lib/supabase/client';
import { CategoriaProducto } from '@/lib/types/database.types';

interface RelatedProduct {
  id: string;
  nombre: string;
  slug: string;
  precio: number;
  precio_comparacion: number | null;
  categoria: CategoriaProducto;
  imagenes: { src: string; etiqueta: string }[];
}

interface RelatedProductsProps {
  currentProductId: string;
  category: CategoriaProducto;
}

export default function RelatedProducts({ currentProductId, category }: RelatedProductsProps) {
  const [products, setProducts] = useState<RelatedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRelatedProducts();
  }, [currentProductId, category]);

  const loadRelatedProducts = async () => {
    setIsLoading(true);
    const supabase = getSupabaseClient();

    try {
      // Primero intentar obtener productos de la misma categoría
      let { data, error } = await supabase
        .from('productos')
        .select('id, nombre, slug, precio, precio_comparacion, categoria, imagenes')
        .eq('categoria', category)
        .eq('activo', true)
        .neq('id', currentProductId)
        .order('fecha_creacion', { ascending: false })
        .limit(4);

      if (error) throw error;

      // Si no hay suficientes productos de la misma categoría, completar con productos nuevos
      if (!data || data.length < 4) {
        const { data: newProducts, error: newError } = await supabase
          .from('productos')
          .select('id, nombre, slug, precio, precio_comparacion, categoria, imagenes')
          .eq('activo', true)
          .neq('id', currentProductId)
          .order('fecha_creacion', { ascending: false })
          .limit(4 - (data?.length || 0));

        if (newError) throw newError;

        // Combinar resultados, evitando duplicados
        const existingIds = new Set(data?.map(p => p.id) || []);
        const uniqueNewProducts = newProducts?.filter(p => !existingIds.has(p.id)) || [];
        data = [...(data || []), ...uniqueNewProducts].slice(0, 4);
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error loading related products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDiscount = (price: number, comparePrice: number | null) => {
    if (comparePrice && comparePrice > price) {
      return Math.round((1 - price / comparePrice) * 100);
    }
    return 0;
  };

  if (isLoading) {
    return (
      <div className="w-full py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Productos Relacionados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-lg mb-4" />
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Productos Relacionados</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, index) => {
            const discount = getDiscount(product.precio, product.precio_comparacion);
            const mainImage = product.imagenes?.[0]?.src || '/images/placeholder.jpg';

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/producto/${product.slug}`} className="group block">
                  {/* Imagen del producto */}
                  <div className="relative aspect-square mb-4 overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={mainImage}
                      alt={product.nombre}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {discount > 0 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                        -{discount}%
                      </div>
                    )}
                  </div>

                  {/* Información del producto */}
                  <h3 className="font-medium text-sm md:text-base mb-2 group-hover:text-gray-600 transition-colors line-clamp-2">
                    {product.nombre}
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base md:text-lg">
                      ${product.precio.toFixed(2)}
                    </span>
                    {product.precio_comparacion && product.precio_comparacion > product.precio && (
                      <span className="text-sm text-gray-400 line-through">
                        ${product.precio_comparacion.toFixed(2)}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
