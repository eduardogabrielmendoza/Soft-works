'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getSupabaseClient } from '@/lib/supabase/client';

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const CATEGORIES = [
  { value: 'camisetas', label: 'Camisetas' },
  { value: 'hoodies', label: 'Hoodies' },
  { value: 'gorras', label: 'Gorras' },
  { value: 'accesorios', label: 'Accesorios' },
];

const SIZE_GUIDE_TYPES = [
  { value: 'mujer', label: 'Mujer' },
  { value: 'varon', label: 'Varón' },
  { value: 'hoodie', label: 'Hoodie' },
  { value: 'gorra', label: 'Gorra' },
];

export default function NuevoProductoPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    descripcion: '',
    precio: '',
    precio_comparacion: '',
    categoria: 'camisetas',
    color: '',
    caracteristicas: [''],
    tipo_guia_talles: 'mujer',
    activo: true,
    destacado: false,
  });

  const [stock, setStock] = useState<Record<string, number>>(
    SIZES.reduce((acc, size) => ({ ...acc, [size]: 0 }), {})
  );

  const [imagenes, setImagenes] = useState<{ src: string; etiqueta: string }[]>([
    { src: '', etiqueta: '' }
  ]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generar slug cuando se escribe el nombre
    if (field === 'nombre') {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleCaracteristicaChange = (index: number, value: string) => {
    const newCaracteristicas = [...formData.caracteristicas];
    newCaracteristicas[index] = value;
    setFormData(prev => ({ ...prev, caracteristicas: newCaracteristicas }));
  };

  const addCaracteristica = () => {
    setFormData(prev => ({ 
      ...prev, 
      caracteristicas: [...prev.caracteristicas, ''] 
    }));
  };

  const removeCaracteristica = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      caracteristicas: prev.caracteristicas.filter((_, i) => i !== index) 
    }));
  };

  const handleImagenChange = (index: number, field: 'src' | 'etiqueta', value: string) => {
    const newImagenes = [...imagenes];
    newImagenes[index][field] = value;
    setImagenes(newImagenes);
  };

  const addImagen = () => {
    setImagenes([...imagenes, { src: '', etiqueta: '' }]);
  };

  const removeImagen = (index: number) => {
    setImagenes(imagenes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.precio) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    if (!formData.slug) {
      alert('El slug es obligatorio');
      return;
    }

    setIsSaving(true);
    const supabase = getSupabaseClient();

    try {
      // Verificar si el slug ya existe
      const { data: existingProduct } = await supabase
        .from('productos')
        .select('id')
        .eq('slug', formData.slug)
        .single();

      if (existingProduct) {
        alert('Ya existe un producto con este slug. Por favor usa un nombre diferente.');
        setIsSaving(false);
        return;
      }

      // Filtrar características vacías
      const caracteristicas = formData.caracteristicas.filter(c => c.trim() !== '');
      
      // Filtrar imágenes vacías
      const imagenesFiltradas = imagenes.filter(img => img.src.trim() !== '');

      const productData = {
        nombre: formData.nombre,
        slug: formData.slug,
        descripcion: formData.descripcion || null,
        precio: parseFloat(formData.precio),
        precio_comparacion: formData.precio_comparacion ? parseFloat(formData.precio_comparacion) : null,
        categoria: formData.categoria,
        color: formData.color || null,
        caracteristicas,
        tipo_guia_talles: formData.tipo_guia_talles,
        imagenes: imagenesFiltradas,
        stock,
        activo: formData.activo,
        destacado: formData.destacado,
        meta_titulo: null,
        meta_descripcion: null,
      };

      const { error } = await supabase
        .from('productos')
        .insert([productData]);

      if (error) throw error;

      alert('Producto creado exitosamente');
      router.push('/admin/productos');
    } catch (error: any) {
      alert('Error al crear el producto: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

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
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin/productos"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Productos
            </Link>
            <h1 className="text-2xl lg:text-3xl font-medium">Nuevo Producto</h1>
            <p className="text-gray-600 mt-2">Completa la información del producto</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium mb-4">Información Básica</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Producto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                    placeholder="Ej: Camiseta Monkey 01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug (URL amigable)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                    placeholder="camiseta-monkey-01"
                  />
                  <p className="text-xs text-gray-500 mt-1">Se genera automáticamente desde el nombre</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                    placeholder="Descripción detallada del producto..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.categoria}
                      onChange={(e) => handleInputChange('categoria', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                      placeholder="Ej: Negro, Blanco, Verde"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Precios */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium mb-4">Precios</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.precio}
                      onChange={(e) => handleInputChange('precio', e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                      placeholder="30000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio de Comparación
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.precio_comparacion}
                      onChange={(e) => handleInputChange('precio_comparacion', e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                      placeholder="40000"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Precio tachado (opcional)</p>
                </div>
              </div>
            </div>

            {/* Características */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Características</h2>
                <button
                  type="button"
                  onClick={addCaracteristica}
                  className="text-sm text-foreground hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </div>
              
              <div className="space-y-2">
                {formData.caracteristicas.map((caracteristica, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={caracteristica}
                      onChange={(e) => handleCaracteristicaChange(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                      placeholder="Ej: 100% Algodón Orgánico"
                    />
                    {formData.caracteristicas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCaracteristica(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stock por Talla */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium mb-4">Stock por Talla</h2>
              
              <div className="grid grid-cols-5 gap-4">
                {SIZES.map(size => (
                  <div key={size}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {size}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={stock[size]}
                      onChange={(e) => setStock({ ...stock, [size]: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Imágenes */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Imágenes</h2>
                <button
                  type="button"
                  onClick={addImagen}
                  className="text-sm text-foreground hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Imagen
                </button>
              </div>
              
              <div className="space-y-4">
                {imagenes.map((imagen, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={imagen.src}
                        onChange={(e) => handleImagenChange(index, 'src', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent mb-2"
                        placeholder="Ruta de la imagen (ej: /images/producto.png)"
                      />
                      <input
                        type="text"
                        value={imagen.etiqueta}
                        onChange={(e) => handleImagenChange(index, 'etiqueta', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                        placeholder="Etiqueta (Ej: Frontal, Trasera)"
                      />
                    </div>
                    {imagenes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImagen(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md h-fit"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Opciones */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium mb-4">Opciones</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Guía de Talles
                  </label>
                  <select
                    value={formData.tipo_guia_talles}
                    onChange={(e) => handleInputChange('tipo_guia_talles', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                  >
                    {SIZE_GUIDE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => handleInputChange('activo', e.target.checked)}
                      className="w-4 h-4 text-foreground border-gray-300 rounded focus:ring-foreground"
                    />
                    <span className="text-sm text-gray-700">Producto activo</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.destacado}
                      onChange={(e) => handleInputChange('destacado', e.target.checked)}
                      className="w-4 h-4 text-foreground border-gray-300 rounded focus:ring-foreground"
                    />
                    <span className="text-sm text-gray-700">Producto destacado</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-end gap-4">
              <Link
                href="/admin/productos"
                className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Crear Producto
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
