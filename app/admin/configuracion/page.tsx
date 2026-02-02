'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Store, 
  CreditCard, 
  Truck, 
  Bell, 
  Mail,
  Save,
  Loader2,
  Globe,
  DollarSign,
  Megaphone
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useSiteConfig, SiteConfig } from '@/lib/hooks/useSiteConfig';

export default function ConfiguracionAdminPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { refreshConfig } = useSiteConfig();
  const [settings, setSettings] = useState<SiteConfig>({
    site_name: 'Softworks',
    site_description: 'Ropa de calidad premium',
    announcement_text: 'Envío gratis en pedidos mayores a $100.000',
    announcement_enabled: true,
    contact_email: 'hola@softworks.com',
    contact_phone: '+54 11 1234-5678',
    contact_address: '',
    contact_hours: 'Lunes a Viernes, 9:00 AM - 5:00 PM',
    social_instagram: '@softworks',
    social_youtube: 'Softworks',
    social_tiktok: '',
    social_twitter: '',
    social_facebook: '',
    shipping_enabled: true,
    free_shipping_threshold: 50000,
    shipping_cost: 5000,
    payment_methods: ['transferencia', 'mercadopago'],
    notifications_enabled: true,
    email_notifications: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const supabase = getSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('configuracion_sitio')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        const config: Partial<SiteConfig> = {};
        data.forEach((item: { clave: string; valor: any }) => {
          if (item.valor && typeof item.valor === 'object') {
            Object.assign(config, item.valor);
          }
        });

        setSettings(prev => ({ ...prev, ...config }));
      }
    } catch {
      // Si no existe la tabla, usar valores por defecto
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const supabase = getSupabaseClient();
    
    try {
      // Guardar cada sección de configuración
      const updates = [
        {
          clave: 'informacion_general',
          valor: {
            site_name: settings.site_name,
            site_description: settings.site_description,
          },
        },
        {
          clave: 'banner_anuncio',
          valor: {
            announcement_text: settings.announcement_text,
            announcement_enabled: settings.announcement_enabled,
          },
        },
        {
          clave: 'contacto',
          valor: {
            contact_email: settings.contact_email,
            contact_phone: settings.contact_phone,
            contact_address: settings.contact_address,
            contact_hours: settings.contact_hours,
          },
        },
        {
          clave: 'redes_sociales',
          valor: {
            social_instagram: settings.social_instagram,
            social_youtube: settings.social_youtube,
            social_tiktok: settings.social_tiktok,
            social_twitter: settings.social_twitter,
            social_facebook: settings.social_facebook,
          },
        },
        {
          clave: 'envios',
          valor: {
            shipping_enabled: settings.shipping_enabled,
            free_shipping_threshold: settings.free_shipping_threshold,
            shipping_cost: settings.shipping_cost,
          },
        },
        {
          clave: 'pagos',
          valor: {
            payment_methods: settings.payment_methods,
          },
        },
        {
          clave: 'notificaciones',
          valor: {
            notifications_enabled: settings.notifications_enabled,
            email_notifications: settings.email_notifications,
          },
        },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('configuracion_sitio')
          .upsert(
            { 
              clave: update.clave, 
              valor: update.valor 
            },
            { onConflict: 'clave' }
          );

        if (error) throw error;
      }
      
      // Actualizar el contexto global
      await refreshConfig();
      
      setSavedMessage('Configuración guardada correctamente');
    } catch (error: any) {
      setSavedMessage('Error al guardar: ' + error.message);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSavedMessage(''), 3000);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
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
            <h1 className="text-2xl lg:text-3xl font-medium flex items-center gap-3">
              <Settings className="w-8 h-8" />
              Configuración
            </h1>
            <p className="text-gray-600 mt-2">Administra la configuración general del sitio</p>
          </div>

          {savedMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              {savedMessage}
            </div>
          )}

          <div className="space-y-6">
            {/* Banner de Anuncio */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Megaphone className="w-6 h-6 text-foreground" />
                <h2 className="text-lg font-medium">Banner de Anuncio</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Este mensaje aparece en la parte superior de la tienda
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mostrar banner</p>
                    <p className="text-sm text-gray-600">Activa o desactiva el banner superior</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.announcement_enabled}
                      onChange={(e) => setSettings({ ...settings, announcement_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-foreground"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Texto del Banner
                  </label>
                  <input
                    type="text"
                    value={settings.announcement_text}
                    onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                    placeholder="Ej: Envío gratis en pedidos mayores a $100.000"
                  />
                </div>

                {/* Vista previa del banner */}
                {settings.announcement_enabled && settings.announcement_text && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vista previa</label>
                    <div className="bg-[#F2F0EB] rounded-full py-2.5 px-6 shadow-sm">
                      <p className="text-xs sm:text-sm font-medium text-[#545454] tracking-wide text-center">
                        {settings.announcement_text}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Información General */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Store className="w-6 h-6 text-foreground" />
                <h2 className="text-lg font-medium">Información General</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                El nombre y descripción aparecerán en la pestaña del navegador
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Sitio
                  </label>
                  <input
                    type="text"
                    value={settings.site_name}
                    onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                    placeholder="Ej: Softworks"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción (aparece en Google y pestaña)
                  </label>
                  <textarea
                    value={settings.site_description}
                    onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                    placeholder="Ej: Ropa de calidad premium"
                  />
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-6 h-6 text-foreground" />
                <h2 className="text-lg font-medium">Información de Contacto</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de Contacto
                  </label>
                  <input
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                    placeholder="hola@tutienda.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="tel"
                    value={settings.contact_phone}
                    onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                    placeholder="+54 11 1234-5678"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección (opcional)
                  </label>
                  <input
                    type="text"
                    value={settings.contact_address}
                    onChange={(e) => setSettings({ ...settings, contact_address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                    placeholder="Calle 123, Ciudad, País"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horario de Atención
                  </label>
                  <input
                    type="text"
                    value={settings.contact_hours}
                    onChange={(e) => setSettings({ ...settings, contact_hours: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                    placeholder="Lunes a Viernes, 9:00 AM - 5:00 PM"
                  />
                </div>
              </div>
            </div>

            {/* Redes Sociales */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-6 h-6 text-foreground" />
                <h2 className="text-lg font-medium">Redes Sociales</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Estas redes se mostrarán en la página de contacto y el footer
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={settings.social_instagram}
                    onChange={(e) => setSettings({ ...settings, social_instagram: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                    placeholder="@tuusuario"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube
                  </label>
                  <input
                    type="text"
                    value={settings.social_youtube}
                    onChange={(e) => setSettings({ ...settings, social_youtube: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                    placeholder="NombreCanal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TikTok
                  </label>
                  <input
                    type="text"
                    value={settings.social_tiktok}
                    onChange={(e) => setSettings({ ...settings, social_tiktok: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                    placeholder="@tuusuario"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter / X
                  </label>
                  <input
                    type="text"
                    value={settings.social_twitter}
                    onChange={(e) => setSettings({ ...settings, social_twitter: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                    placeholder="@tuusuario"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook
                  </label>
                  <input
                    type="text"
                    value={settings.social_facebook}
                    onChange={(e) => setSettings({ ...settings, social_facebook: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                    placeholder="tupagina"
                  />
                </div>
              </div>
            </div>

            {/* Opciones de Envío */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Truck className="w-6 h-6 text-foreground" />
                <h2 className="text-lg font-medium">Envíos</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Habilitar envíos</p>
                    <p className="text-sm text-gray-600">Permitir que los clientes realicen pedidos con envío</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.shipping_enabled}
                      onChange={(e) => setSettings({ ...settings, shipping_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-foreground"></div>
                  </label>
                </div>

                {settings.shipping_enabled && (
                  <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Costo de Envío (ARS)
                      </label>
                      <input
                        type="number"
                        value={settings.shipping_cost}
                        onChange={(e) => setSettings({ ...settings, shipping_cost: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                        placeholder="5000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Envío Gratis a partir de (ARS)
                      </label>
                      <input
                        type="number"
                        value={settings.free_shipping_threshold}
                        onChange={(e) => setSettings({ ...settings, free_shipping_threshold: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-foreground focus:border-transparent"
                        placeholder="50000"
                      />
                      <p className="text-xs text-gray-500 mt-1">Coloca 0 para deshabilitar envío gratis</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Métodos de Pago */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-6 h-6 text-foreground" />
                <h2 className="text-lg font-medium">Métodos de Pago</h2>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.payment_methods.includes('transferencia')}
                    onChange={(e) => {
                      const methods = e.target.checked 
                        ? [...settings.payment_methods, 'transferencia']
                        : settings.payment_methods.filter(m => m !== 'transferencia');
                      setSettings({ ...settings, payment_methods: methods });
                    }}
                    className="w-4 h-4 text-foreground border-gray-300 rounded focus:ring-foreground"
                  />
                  <span>Transferencia Bancaria</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.payment_methods.includes('mercadopago')}
                    onChange={(e) => {
                      const methods = e.target.checked 
                        ? [...settings.payment_methods, 'mercadopago']
                        : settings.payment_methods.filter(m => m !== 'mercadopago');
                      setSettings({ ...settings, payment_methods: methods });
                    }}
                    className="w-4 h-4 text-foreground border-gray-300 rounded focus:ring-foreground"
                  />
                  <span>Mercado Pago</span>
                </label>
              </div>
            </div>

            {/* Notificaciones */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="w-6 h-6 text-foreground" />
                <h2 className="text-lg font-medium">Notificaciones</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificaciones del sistema</p>
                    <p className="text-sm text-gray-600">Recibir alertas sobre nuevos pedidos y actividad</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications_enabled}
                      onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-foreground"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificaciones por email</p>
                    <p className="text-sm text-gray-600">Enviar resumen diario de actividad</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email_notifications}
                      onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-foreground"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Botón Guardar */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
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
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
