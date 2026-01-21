'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, Package, LogOut, Loader2, Plus, Trash2, Check, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getUserAddresses, createAddress, deleteAddress, setDefaultAddress, ARGENTINA_PROVINCES } from '@/lib/api/addresses';
import type { Direccion } from '@/lib/types/database.types';

export default function DireccionesPage() {
  const router = useRouter();
  const { user, profile, signOut, isLoading: authLoading } = useAuth();
  
  const [addresses, setAddresses] = useState<Direccion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre_destinatario: '',
    calle: '',
    numero: '',
    piso_depto: '',
    ciudad: '',
    provincia: '',
    codigo_postal: '',
    telefono: '',
    indicaciones: '',
    es_predeterminada: false,
  });

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        loadAddresses();
      } else {
        setIsLoading(false);
      }
    }
  }, [user, authLoading]);

  const loadAddresses = async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await getUserAddresses(user.id);
    setAddresses(data);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    try {
      await createAddress({
        usuario_id: user.id,
        etiqueta: 'Casa',
        nombre_destinatario: formData.nombre_destinatario,
        calle: formData.calle,
        numero: formData.numero,
        piso_depto: formData.piso_depto || null,
        ciudad: formData.ciudad,
        provincia: formData.provincia,
        codigo_postal: formData.codigo_postal,
        pais: 'Argentina',
        telefono: formData.telefono || null,
        indicaciones: formData.indicaciones || null,
        es_predeterminada: formData.es_predeterminada || addresses.length === 0,
      });
      
      await loadAddresses();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Error creating address:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!user) return;
    if (!confirm('¿Estás seguro de eliminar esta dirección?')) return;
    
    try {
      await deleteAddress(addressId, user.id);
      await loadAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!user) return;
    try {
      await setDefaultAddress(addressId, user.id);
      await loadAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre_destinatario: '',
      calle: '',
      numero: '',
      piso_depto: '',
      ciudad: '',
      provincia: '',
      codigo_postal: '',
      telefono: '',
      indicaciones: '',
      es_predeterminada: false,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 py-12 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl lg:text-4xl font-medium mb-8">Mi Cuenta</h1>

        {/* Navigation */}
        <div className="flex flex-wrap gap-4 mb-8 border-b border-gray-200 pb-4">
          <Link
            href="/cuenta/perfil"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <User className="w-4 h-4" />
            Perfil
          </Link>
          <Link
            href="/cuenta/pedidos"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Package className="w-4 h-4" />
            Mis Pedidos
          </Link>
          <Link
            href="/cuenta/direcciones"
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-white rounded-md"
          >
            <MapPin className="w-4 h-4" />
            Direcciones
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors ml-auto"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>

        {/* Add Address Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 mb-6 px-4 py-2 border border-dashed border-gray-300 rounded-md hover:bg-gray-50 transition-colors w-full justify-center"
          >
            <Plus className="w-4 h-4" />
            Agregar Nueva Dirección
          </button>
        )}

        {/* Add Address Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white rounded-lg border border-gray-200 p-6 mb-6"
          >
            <h2 className="text-xl font-medium mb-6">Nueva Dirección</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del destinatario *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre_destinatario}
                    onChange={(e) => setFormData({ ...formData, nombre_destinatario: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Calle *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.calle}
                    onChange={(e) => setFormData({ ...formData, calle: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="Av. Corrientes"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                      placeholder="1234"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Piso/Depto
                    </label>
                    <input
                      type="text"
                      value={formData.piso_depto}
                      onChange={(e) => setFormData({ ...formData, piso_depto: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                      placeholder="2° B"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="Buenos Aires"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provincia *
                  </label>
                  <select
                    required
                    value={formData.provincia}
                    onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    <option value="">Seleccionar...</option>
                    {ARGENTINA_PROVINCES.map((province: string) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código Postal *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.codigo_postal}
                    onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="C1043"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono de contacto
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="11 1234-5678"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referencias adicionales
                  </label>
                  <input
                    type="text"
                    value={formData.indicaciones}
                    onChange={(e) => setFormData({ ...formData, indicaciones: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="Timbre 2B, portón negro"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.es_predeterminada}
                      onChange={(e) => setFormData({ ...formData, es_predeterminada: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Usar como dirección predeterminada</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Dirección'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Addresses List */}
        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tenés direcciones guardadas</p>
            </div>
          ) : (
            addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white rounded-lg border p-6 ${
                  address.es_predeterminada ? 'border-foreground' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    {address.es_predeterminada && (
                      <span className="inline-block px-2 py-1 bg-foreground text-white text-xs rounded mb-2">
                        Predeterminada
                      </span>
                    )}
                    <p className="font-medium">{address.nombre_destinatario}</p>
                    <p className="text-gray-600">
                      {address.calle} {address.numero}
                      {address.piso_depto && `, ${address.piso_depto}`}
                    </p>
                    <p className="text-gray-600">
                      {address.ciudad}, {address.provincia} - CP {address.codigo_postal}
                    </p>
                    {address.telefono && (
                      <p className="text-gray-500 text-sm mt-1">Tel: {address.telefono}</p>
                    )}
                    {address.indicaciones && (
                      <p className="text-gray-500 text-sm mt-1">{address.indicaciones}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!address.es_predeterminada && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="p-2 text-gray-400 hover:text-foreground transition-colors"
                        title="Usar como predeterminada"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
