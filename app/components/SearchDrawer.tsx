'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import SideDrawer from './SideDrawer';
import { getSupabaseClient } from '@/lib/supabase/client';

interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Product {
  id: string;
  nombre: string;
  slug: string;
  precio: number;
  imagenes: { src: string; etiqueta?: string }[];
}

const popularSearches = [
  'Camiseta',
  'Hoodie',
  'Gorra',
  'Negro',
  'Blanco',
];

export default function SearchDrawer({ isOpen, onClose }: SearchDrawerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Cargar productos destacados
  useEffect(() => {
    const loadFeaturedProducts = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('productos')
        .select('id, nombre, slug, precio, imagenes')
        .eq('activo', true)
        .eq('destacado', true)
        .limit(4);
      
      if (data) setFeaturedProducts(data);
    };

    if (isOpen) {
      loadFeaturedProducts();
      // Cargar búsquedas recientes del localStorage
      const saved = localStorage.getItem('recentSearches');
      if (saved) setRecentSearches(JSON.parse(saved));
    }
  }, [isOpen]);

  // Buscar productos
  useEffect(() => {
    const searchProducts = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('productos')
        .select('id, nombre, slug, precio, imagenes')
        .eq('activo', true)
        .ilike('nombre', `%${query}%`)
        .limit(6);

      setResults(data || []);
      setIsSearching(false);
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    // Guardar en búsquedas recientes
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleProductClick = () => {
    if (query) {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }
    onClose();
    setQuery('');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      showHeader={false}
      width="md"
    >
      <div className="flex flex-col h-full">
        {/* Search Header */}
        <div className="p-6 border-b border-[#545454]/10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#545454]/60" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full pl-12 pr-4 py-4 bg-[#F2F0EB] text-[#545454] rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#545454]/20 transition-all placeholder:text-[#545454]/50"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {query.length >= 2 ? (
            // Resultados de búsqueda
            <div className="space-y-4">
              <p className="text-sm text-[#545454]/70 uppercase tracking-wide">
                {isSearching ? 'Buscando...' : `${results.length} resultados`}
              </p>
              
              {results.length > 0 ? (
                <div className="space-y-3">
                  {results.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={`/producto/${product.slug}`}
                        onClick={handleProductClick}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#F2F0EB] transition-colors group"
                      >
                        <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-[#F2F0EB] flex-shrink-0">
                          {product.imagenes?.[0]?.src && (
                            <Image
                              src={product.imagenes[0].src}
                              alt={product.nombre}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#545454] truncate group-hover:text-black">
                            {product.nombre}
                          </p>
                          <p className="text-sm text-[#545454]/70">
                            {formatPrice(product.precio)}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#545454]/40 group-hover:text-[#545454] transition-colors" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : !isSearching && (
                <div className="text-center py-12">
                  <p className="text-[#545454]">No se encontraron productos</p>
                  <p className="text-sm text-[#545454]/60 mt-1">Intentá con otro término</p>
                </div>
              )}
            </div>
          ) : (
            // Estado inicial - Sugerencias y Productos Destacados
            <div className="space-y-8">
              {/* Búsquedas recientes */}
              {recentSearches.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[#545454]/70 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Recientes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSearch(term)}
                        className="px-4 py-2 bg-[#F2F0EB] hover:bg-[#545454]/10 text-[#545454] rounded-full text-sm transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Búsquedas populares */}
              <div>
                <h3 className="text-sm font-medium text-[#545454]/70 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Populares
                </h3>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSearch(term)}
                      className="px-4 py-2 bg-[#F2F0EB] hover:bg-[#545454]/10 text-[#545454] rounded-full text-sm transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Productos destacados */}
              {featuredProducts.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[#545454]/70 uppercase tracking-wide mb-4">
                    Productos Destacados
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {featuredProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link
                          href={`/producto/${product.slug}`}
                          onClick={handleProductClick}
                          className="group block"
                        >
                          <div className="aspect-square relative rounded-xl overflow-hidden bg-[#F2F0EB] mb-2">
                            {product.imagenes?.[0]?.src && (
                              <Image
                                src={product.imagenes[0].src}
                                alt={product.nombre}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            )}
                          </div>
                          <p className="font-medium text-sm text-[#545454] truncate group-hover:text-black">
                            {product.nombre}
                          </p>
                          <p className="text-sm text-[#545454]/70">
                            {formatPrice(product.precio)}
                          </p>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SideDrawer>
  );
}
