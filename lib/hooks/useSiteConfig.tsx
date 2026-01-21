'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

export interface SiteConfig {
  // Información general
  site_name: string;
  site_description: string;
  
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
  
  // Pagos
  payment_methods: string[];
  
  // Notificaciones
  notifications_enabled: boolean;
  email_notifications: boolean;
}

const defaultConfig: SiteConfig = {
  site_name: 'Softworks',
  site_description: 'Ropa de calidad premium',
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
};

interface SiteConfigContextType {
  config: SiteConfig;
  isLoading: boolean;
  refreshConfig: () => Promise<void>;
}

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const loadConfig = async () => {
    const supabase = getSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('configuracion_sitio')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedConfig: Partial<SiteConfig> = {};
        data.forEach((item: { clave: string; valor: any }) => {
          if (item.valor && typeof item.valor === 'object') {
            Object.assign(loadedConfig, item.valor);
          }
        });

        setConfig(prev => ({ ...prev, ...loadedConfig }));
      }
    } catch {
      // Usar valores por defecto si hay error
    } finally {
      setIsLoading(false);
    }
  };

  const refreshConfig = async () => {
    await loadConfig();
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Actualizar el título del documento cuando cambie el nombre del sitio o la ruta
  useEffect(() => {
    if (typeof document !== 'undefined' && config.site_name) {
      // Mantener el título actualizado en cada navegación
      document.title = `${config.site_name} - ${config.site_description}`;
    }
  }, [config.site_name, config.site_description, pathname]);

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
