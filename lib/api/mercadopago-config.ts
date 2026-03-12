import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig } from 'mercadopago';

export type MercadoPagoMode = 'production' | 'sandbox';

/**
 * Get the current MercadoPago mode from the configuracion_sitio table.
 * Returns 'production' by default if not set.
 */
export async function getMercadoPagoMode(): Promise<MercadoPagoMode> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data } = await supabase
      .from('configuracion_sitio')
      .select('valor')
      .eq('clave', 'mercadopago')
      .single();

    if (data?.valor && typeof data.valor === 'object') {
      const config = data.valor as Record<string, unknown>;
      return (config.mercadopago_mode as MercadoPagoMode) || 'production';
    }
  } catch {
    // Default to production if config can't be read
  }
  return 'production';
}

/**
 * Get MercadoPago access token based on the current mode.
 */
export function getAccessToken(mode: MercadoPagoMode): string {
  if (mode === 'sandbox') {
    return process.env.MERCADOPAGO_ACCESS_TOKEN_SANDBOX || '';
  }
  return process.env.MERCADOPAGO_ACCESS_TOKEN_PRODUCTION || '';
}

/**
 * Create a MercadoPagoConfig client for the current mode.
 */
export function createMPClient(mode: MercadoPagoMode): MercadoPagoConfig {
  return new MercadoPagoConfig({
    accessToken: getAccessToken(mode),
  });
}
