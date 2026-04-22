'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getCached, setCache, isCacheFresh } from '@/lib/utils/cache';
import {
  DEFAULT_SHIPPING_RATES,
  getLegacyShippingCost,
  normalizeShippingRatesConfig,
  type ShippingRatesConfig,
} from '@/lib/utils/shipping';

const CACHE_KEY = 'site_config';

function parseConfigValue(value: unknown) {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export interface SiteConfig {
  // Información general
  site_name: string;
  site_description: string;
  
  // Banner de anuncio
  announcement_text: string;
  announcement_enabled: boolean;
  
  // Contacto
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  contact_hours: string;
  
  // Redes sociales
  social_instagram: string;
  social_youtube: string;
  social_tiktok: string;
  social_twitter: string;
  social_facebook: string;
  
  // Envíos
  shipping_enabled: boolean;
  free_shipping_threshold: number;
  shipping_cost: number;
  shipping_rates: ShippingRatesConfig;
  
  // Pagos
  payment_methods: string[];
  mercadopago_mode: 'production' | 'sandbox';

  // Apariencia
  login_imagen?: string;
  registro_imagen?: string;
}

function toSafeNumber(value: unknown, fallback: number) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

const defaultConfig: SiteConfig = {
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
  shipping_cost: getLegacyShippingCost(DEFAULT_SHIPPING_RATES),
  shipping_rates: DEFAULT_SHIPPING_RATES,
  payment_methods: ['transferencia', 'mercadopago'],
  mercadopago_mode: 'production',
  login_imagen: '',
  registro_imagen: '',
};

function normalizeSiteConfig(config?: Partial<SiteConfig> | null): SiteConfig {
  const merged = { ...defaultConfig, ...config };

  return {
    ...merged,
    free_shipping_threshold: toSafeNumber(
      merged.free_shipping_threshold,
      defaultConfig.free_shipping_threshold,
    ),
    shipping_cost: toSafeNumber(merged.shipping_cost, defaultConfig.shipping_cost),
    shipping_rates: normalizeShippingRatesConfig(config?.shipping_rates),
  };
}

interface SiteConfigContextType {
  config: SiteConfig;
  isLoading: boolean;
  refreshConfig: () => Promise<void>;
}

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export function SiteConfigProvider({ children, initialData }: { children: ReactNode; initialData?: Partial<SiteConfig> }) {
  const serverData = initialData ? normalizeSiteConfig(initialData) : null;
  const cached = serverData || getCached<Partial<SiteConfig>>(CACHE_KEY);
  const [config, setConfig] = useState<SiteConfig>(normalizeSiteConfig(cached || defaultConfig));
  const [isLoading, setIsLoading] = useState(!cached);
  const pathname = usePathname();

  const loadConfig = useCallback(async () => {
    const supabase = getSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('configuracion_sitio')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedConfig: Partial<SiteConfig> = {};
        data.forEach((item: { clave: string; valor: any }) => {
          const parsed = parseConfigValue(item.valor);
          if (parsed && typeof parsed === 'object') {
            Object.assign(loadedConfig, parsed);
          }
        });

        const merged = normalizeSiteConfig(loadedConfig);
        setConfig(merged);
        setCache(CACHE_KEY, merged);
      }
    } catch {
      // Usar valores por defecto si hay error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshConfig = useCallback(async () => {
    await loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (serverData) setCache(CACHE_KEY, serverData);
    if (isCacheFresh(CACHE_KEY)) return; // skip if cache is fresh
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'content-preview' && e.data?.key === 'apariencia') {
        setConfig(prev => {
          const merged = normalizeSiteConfig({ ...prev, ...e.data.value });
          setCache(CACHE_KEY, merged);
          return merged;
        });
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Actualizar el título del documento dinámicamente según la ruta
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const pageTitles: Record<string, string> = {
      '/': 'Tienda Online',
      '/colecciones': 'Colecciones',
      '/contacto': 'Contacto',
      '/nosotros': 'Nosotros',
      '/preguntas-frecuentes': 'Preguntas Frecuentes',
      '/cuenta': 'Mi Cuenta',
      '/cuenta/perfil': 'Mi Perfil',
      '/cuenta/pedidos': 'Mis Pedidos',
      '/cuenta/direcciones': 'Mis Direcciones',
      '/cuenta/registro': 'Registro',
      '/cuenta/reset-password': 'Recuperar Contraseña',
      '/checkout': 'Checkout',
      '/checkout/confirmacion': 'Confirmación de Pedido',
      '/politica-privacidad': 'Política de Privacidad',
      '/politica-cookies': 'Política de Cookies',
      '/terminos-servicio': 'Términos de Servicio',
      '/no-vender-informacion': 'Privacidad de Datos',
      '/accesibilidad': 'Accesibilidad',
      '/impacto': 'Impacto',
      '/eventos': 'Eventos',
      '/ubicaciones': 'Ubicaciones',
      '/vlog': 'Vlog',
      '/futuros-softworks': 'Futuros Softworks',
      '/admin': 'Panel Admin',
    };
    const pageLabel = pageTitles[pathname] || (pathname.startsWith('/producto/') ? 'Producto' : pathname.startsWith('/admin/') ? 'Panel Admin' : null);
    document.title = pageLabel ? `Softworks - ${pageLabel}` : 'Softworks - Tienda Online';
  }, [pathname]);

  return (
    <SiteConfigContext.Provider value={{ config, isLoading, refreshConfig }}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  const context = useContext(SiteConfigContext);
  if (context === undefined) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  }
  return context;
}
