'use client';

import { useState, useEffect, use, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Check, Loader2, ZoomIn } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/hooks/useCart';
import { useAuth } from '@/lib/hooks/useAuth';
import { getSupabaseClient } from '@/lib/supabase/client';
import { CategoriaProducto } from '@/lib/types/database.types';
import RelatedProducts from '@/app/components/RelatedProducts';
import AuthPromptModal from '@/app/components/AuthPromptModal';

interface Producto {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  precio: number;
  precio_comparacion: number | null;
  categoria: CategoriaProducto;
  color: string | null;
  caracteristicas: string[];
  tipo_guia_talles: 'mujer' | 'varon' | 'hoodie' | 'gorra' | null;
  imagenes: { src: string; etiqueta: string }[];
  stock: Record<string, number>;
  activo: boolean;
  destacado: boolean;
  meta_titulo: string | null;
  meta_descripcion: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export default function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Producto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showAddedMessage, setShowAddedMessage] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Lens zoom state
  const [isLensActive, setIsLensActive] = useState(false);
  const mainImageRef = useRef<HTMLDivElement>(null);
  const lensOverlayRef = useRef<HTMLDivElement>(null);
  const lensRaf = useRef(0);

  const images = product?.imagenes || [];
  const hasRealImages = images.length > 0;

  const isGuestAccepted = () => {
    try { return localStorage.getItem('softworks_guest_accepted') === 'true'; } catch { return false; }
  };

  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

  // Desktop lens zoom: follow mouse over main image (rAF for perf)
  const handleLensMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    cancelAnimationFrame(lensRaf.current);
    lensRaf.current = requestAnimationFrame(() => {
      if (!mainImageRef.current || !lensOverlayRef.current) return;
      const rect = mainImageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      const cx = Math.max(0, Math.min(100, x));
      const cy = Math.max(0, Math.min(100, y));
      lensOverlayRef.current.style.backgroundPosition = `${cx}% ${cy}%`;
    });
  }, []);

  // Cleanup lens rAF
  useEffect(() => () => cancelAnimationFrame(lensRaf.current), []);

  // Cargar producto desde Supabase
  useEffect(() => {
    loadProduct();
  }, [slug]);

  const loadProduct = async () => {
    setIsLoading(true);
    const supabase = getSupabaseClient();

    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;

      // Si el producto no está activo, redirigir a colecciones
      if (data && !data.activo) {
        router.push('/colecciones');
        return;
      }

      setProduct(data);
    } catch {
      // Error cargando producto
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular stock total
  const getTotalStock = () => {
    if (!product?.stock) return 0;
    return Object.values(product.stock).reduce((sum, qty) => sum + qty, 0);
  };

  // Verificar si una talla está agotada
  const isSizeOutOfStock = (size: string) => {
    if (!product?.stock) return false;
    return (product.stock[size] || 0) === 0;
  };

  // Verificar si todo el producto está agotado
  const isOutOfStock = getTotalStock() === 0;

  // Calcular descuento
  const getDiscount = () => {
    if (product?.precio_comparacion && product.precio_comparacion > product.precio) {
      return Math.round((1 - product.precio / product.precio_comparacion) * 100);
    }
    return 0;
  };

  const placeholderViews = ['Frontal', 'Lateral', 'Trasera', 'Detalle'];

  if (isLoading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-20 min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-medium mb-4">Producto no encontrado</h1>
        <Link href="/colecciones" className="text-foreground/70 hover:text-foreground underline">
          Volver a Colecciones
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-20">
      {/* Breadcrumb */}
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <Link href="/colecciones" className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Volver a Colección
        </Link>
      </div>

      <div className="px-4 pb-16 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Galería de imágenes */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
                      {hasRealImages ? (
              <>
                <div 
                  ref={mainImageRef}
                  className="aspect-square rounded-lg mb-4 relative overflow-hidden bg-gray-100 group"
                  onMouseEnter={() => setIsLensActive(true)}
                  onMouseLeave={() => setIsLensActive(false)}
                  onMouseMove={handleLensMove}
                >
                  <Image
                    src={images[selectedImage].src}
                    alt={`${product.nombre} - ${images[selectedImage].etiqueta}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className={`object-cover transition-opacity duration-300 ${isOutOfStock ? 'grayscale' : ''}`}
                    priority
                  />
                  {/* Lens zoom overlay - desktop only */}
                  <div
                    ref={lensOverlayRef}
                    className={`absolute inset-0 hidden lg:block pointer-events-none transition-opacity duration-200 ${isLensActive ? 'opacity-100' : 'opacity-0'}`}
                    style={{
                      backgroundImage: `url(${images[selectedImage].src})`,
                      backgroundPosition: '50% 50%',
                      backgroundSize: '250%',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                  {/* Zoom icon indicator */}
                  <div className={`absolute bottom-3 right-3 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-opacity duration-200 pointer-events-none ${isLensActive ? 'opacity-0' : 'opacity-70 group-hover:opacity-100'}`}>
                    <ZoomIn className="w-4 h-4 text-black" />
                  </div>
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {isOutOfStock && (
                      <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium">
                        Agotado
                      </span>
                    )}
                    {getDiscount() > 0 && !isOutOfStock && (
                      <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium">
                        -{getDiscount()}%
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Miniaturas */}
                <div className={`grid gap-3 ${images.length === 2 ? 'grid-cols-2' : images.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                  {images.map((image, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`aspect-square rounded-md overflow-hidden relative transition-all ${
                        selectedImage === i ? 'ring-2 ring-foreground' : 'hover:opacity-75'
                      }`}
                    >
                      <Image
                        src={image.src}
                        alt={image.etiqueta}
                        fill
                        sizes="100px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex flex-col items-center justify-center relative">
                  <span className="text-gray-400 text-sm">Sin imagen</span>
                </div>
                
                {/* Miniaturas placeholder */}
                <div className="grid grid-cols-4 gap-3">
                  {placeholderViews.map((view, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`aspect-square bg-gray-100 rounded-md flex flex-col items-center justify-center transition-all ${
                        selectedImage === i ? 'ring-2 ring-foreground' : 'hover:bg-gray-200'
                      }`}
                    >
                      <span className="text-xs text-gray-400">{view}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </motion.div>

          {/* Información del producto */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:pt-8">
            <div className="mb-6">
              <h1 className="text-3xl lg:text-4xl font-medium mb-3">{product.nombre}</h1>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-medium">${product.precio.toLocaleString('es-AR')}</p>
                {product.precio_comparacion && product.precio_comparacion > product.precio && (
                  <p className="text-xl text-gray-400 line-through">${product.precio_comparacion.toLocaleString('es-AR')}</p>
                )}
              </div>
            </div>

            {/* Descripción */}
            <div className="mb-8">
              <p className="text-foreground/70 leading-relaxed mb-4">
                {product.descripcion || 'Descripción del producto.'}
              </p>
              {product.caracteristicas && product.caracteristicas.length > 0 && (
                <ul className="space-y-2 text-sm text-foreground/70">
                  {product.caracteristicas.map((feature, i) => (
                    <li key={i}>• {feature}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Selector de talla */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">Talla</label>
                <button 
                  onClick={() => setShowSizeGuide(!showSizeGuide)}
                  className="text-sm text-foreground/70 hover:text-foreground underline"
                >
                  Guía de tallas
                </button>
              </div>
              
              {/* Guía de tallas modal */}
              {showSizeGuide && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-4 bg-gray-50 rounded-lg overflow-hidden"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">Guía de Tallas</h3>
                    <button 
                      onClick={() => setShowSizeGuide(false)}
                      className="text-foreground/70 hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    {/* Guía de tallas unificada (remeras, hoodies, etc.) */}
                    {(product.tipo_guia_talles === 'mujer' || product.tipo_guia_talles === 'varon' || product.tipo_guia_talles === 'hoodie') && (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 pr-4">Talla</th>
                            <th className="text-left py-2 pr-4">Ancho (cm)</th>
                            <th className="text-left py-2">Largo (cm)</th>
                          </tr>
                        </thead>
                        <tbody className="text-foreground/70">
                          <tr className="border-b">
                            <td className="py-2 pr-4">S</td>
                            <td className="py-2 pr-4">51</td>
                            <td className="py-2">68</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 pr-4">M</td>
                            <td className="py-2 pr-4">53</td>
                            <td className="py-2">70</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 pr-4">L</td>
                            <td className="py-2 pr-4">57</td>
                            <td className="py-2">72</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 pr-4">XL</td>
                            <td className="py-2 pr-4">58</td>
                            <td className="py-2">74</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4">XXL</td>
                            <td className="py-2 pr-4">59</td>
                            <td className="py-2">75</td>
                          </tr>
                        </tbody>
                      </table>
                    )}

                    {/* Guía de tallas para gorra */}
                    {product.tipo_guia_talles === 'gorra' && (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 pr-4">Talla</th>
                            <th className="text-left py-2 pr-4">Circunferencia (cm)</th>
                            <th className="text-left py-2">Equivalencia</th>
                          </tr>
                        </thead>
                        <tbody className="text-foreground/70">
                          <tr className="border-b">
                            <td className="py-2 pr-4">XS</td>
                            <td className="py-2 pr-4">54-55</td>
                            <td className="py-2">6 3/4 - 6 7/8</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 pr-4">S</td>
                            <td className="py-2 pr-4">55-57</td>
                            <td className="py-2">7 - 7 1/8</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 pr-4">M</td>
                            <td className="py-2 pr-4">57-59</td>
                            <td className="py-2">7 1/4 - 7 3/8</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 pr-4">L</td>
                            <td className="py-2 pr-4">59-61</td>
                            <td className="py-2">7 1/2 - 7 5/8</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4">XL</td>
                            <td className="py-2 pr-4">61-63</td>
                            <td className="py-2">7 3/4 - 7 7/8</td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                  <p className="text-xs text-foreground/60 mt-3">
                    {product.tipo_guia_talles === 'gorra' 
                      ? 'Para medir tu talla, usa una cinta métrica alrededor de tu cabeza, aproximadamente 2.5 cm sobre las orejas.'
                      : 'Medidas en centímetros. Si estás entre dos tallas, te recomendamos elegir la mayor.'
                    }
                  </p>
                </motion.div>
              )}
              
              <div className="grid grid-cols-5 gap-2">
                {sizes.map((size) => {
                  const outOfStock = isSizeOutOfStock(size);
                  return (
                    <button
                      key={size}
                      onClick={() => !outOfStock && setSelectedSize(size)}
                      disabled={outOfStock}
                      className={`py-3 rounded-md border transition-all relative ${
                        outOfStock
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : selectedSize === size
                          ? 'border-foreground bg-foreground text-white'
                          : 'border-gray-300 hover:border-foreground'
                      }`}
                    >
                      {size}
                      {outOfStock && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-full h-[1px] bg-gray-400 absolute rotate-45"></span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cantidad */}
            <div className="mb-8">
              <label className="text-sm font-medium block mb-3">Cantidad</label>
              <div className="flex items-center gap-4 w-32">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  −
                </button>
                <span className="flex-1 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Botón agregar al carrito */}
            <button 
              disabled={!selectedSize || isOutOfStock}
              onClick={() => {
                if (selectedSize && product && !isOutOfStock) {
                  if (!user && !isGuestAccepted()) {
                    setShowAuthPrompt(true);
                    return;
                  }
                  addItem(product, selectedSize, quantity);
                  setShowAddedMessage(true);
                  setTimeout(() => setShowAddedMessage(false), 3000);
                }
              }}
              className="w-full py-4 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-4 flex items-center justify-center gap-2"
            >
              {showAddedMessage ? (
                <>
                  <Check className="w-5 h-5" />
                  Agregado al carrito
                </>
              ) : isOutOfStock ? (
                'Producto Agotado'
              ) : (
                selectedSize ? 'Agregar al Carrito' : 'Selecciona una talla'
              )}
            </button>

            {/* Detalles adicionales */}
            <div className="border-t border-gray-200 pt-6 space-y-4 text-sm">
              <details className="group">
                <summary className="cursor-pointer font-medium flex items-center justify-between">
                  Envíos
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-foreground/70">
                  Envío gratuito en pedidos superiores a $100.000 ARS. No se aceptan devoluciones.
                </p>
              </details>
              
              <details className="group">
                <summary className="cursor-pointer font-medium flex items-center justify-between">
                  Cuidados
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <ul className="mt-3 text-foreground/70 space-y-1.5 list-none">
                  <li>• Lavado a máquina en agua fría</li>
                  <li>• Lavar a seco</li>
                  <li>• Plancha tibia</li>
                  <li>• Evitar planchado sobre la estampa</li>
                  <li>• No usar lavandina</li>
                </ul>
              </details>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Productos Relacionados */}
      {product && (
        <RelatedProducts 
          currentProductId={product.id} 
          category={product.categoria} 
        />
      )}

      <AuthPromptModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        onGuestContinue={() => {
          try { localStorage.setItem('softworks_guest_accepted', 'true'); } catch {}
          if (selectedSize && product && !isOutOfStock) {
            addItem(product, selectedSize, quantity);
            setShowAddedMessage(true);
            setTimeout(() => setShowAddedMessage(false), 3000);
          }
        }}
      />
    </div>
  );
}
