import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig } from 'mercadopago';

export type MercadoPagoMode = 'production' | 'sandbox';

interface MercadoPagoDBConfig {
  mercadopago_mode?: MercadoPagoMode;
  access_token_production?: string;
  access_token_sandbox?: string;
  public_key_production?: string;
  public_key_sandbox?: string;
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Get the full MercadoPago config from the database.
 */
export async function getMercadoPagoConfig(): Promise<MercadoPagoDBConfig> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('configuracion_sitio')
      .select('valor')
      .eq('clave', 'mercadopago')
      .single();

    if (data?.valor && typeof data.valor === 'object') {
      return data.valor as MercadoPagoDBConfig;
    }
  } catch {
    // Fallback to defaults
  }
  return {};
}

/**
 * Get the current MercadoPago mode from the configuracion_sitio table.
 */
export async function getMercadoPagoMode(): Promise<MercadoPagoMode> {
  const config = await getMercadoPagoConfig();
  return config.mercadopago_mode || 'production';
}

/**
 * Get MercadoPago access token based on the current mode.
 * Reads from DB first, falls back to env vars.
 */
export async function getAccessToken(mode: MercadoPagoMode): Promise<string> {
  const config = await getMercadoPagoConfig();

  if (mode === 'sandbox') {
    return config.access_token_sandbox
      || process.env.MERCADOPAGO_ACCESS_TOKEN_SANDBOX
      || '';
  }
  return config.access_token_production
    || process.env.MERCADOPAGO_ACCESS_TOKEN_PRODUCTION
    || '';
}

/**
 * Create a MercadoPagoConfig client for the current mode.
 */
export async function createMPClient(mode: MercadoPagoMode): Promise<MercadoPagoConfig> {
  const token = await getAccessToken(mode);
  return new MercadoPagoConfig({ accessToken: token });
}
