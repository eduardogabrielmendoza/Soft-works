import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendConfirmationEmail, sendPasswordResetEmail } from '@/lib/email';

const HOOK_SECRET = process.env.SUPABASE_AUTH_HOOK_SECRET || '';

// Supabase firma los webhooks con HMAC-SHA256 en formato "v1,<base64>"
function verifySignature(payload: string, signatureHeader: string): boolean {
  if (!HOOK_SECRET || !signatureHeader) return false;

  const parts = signatureHeader.split(',');
  if (parts.length !== 2 || parts[0] !== 'v1') return false;

  const hmac = crypto.createHmac('sha256', HOOK_SECRET);
  hmac.update(payload);
  const computed = hmac.digest('base64');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(parts[1])
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-supabase-signature') || '';

  if (!verifySignature(rawBody, signature)) {
    console.error('[Auth Hook] Firma inválida');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody);
    const { user, email_data } = body;

    const email = user?.email;
    if (!email || !email_data) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const { token_hash, email_action_type, redirect_to, site_url } = email_data;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const finalRedirect = redirect_to || site_url || process.env.NEXT_PUBLIC_SITE_URL || '';

    // Construir URL de verificación de Supabase
    const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(finalRedirect)}`;

    const customerName = user.user_metadata?.nombre
      || user.user_metadata?.full_name
      || '';

    switch (email_action_type) {
      case 'signup':
        await sendConfirmationEmail({ to: email, customerName, confirmationUrl });
        break;

      case 'recovery':
        await sendPasswordResetEmail({ to: email, customerName, confirmationUrl });
        break;

      case 'email_change':
        // Si en el futuro querés manejar cambio de email, agregá template acá
        await sendConfirmationEmail({ to: email, customerName, confirmationUrl });
        break;

      default:
        console.log(`[Auth Hook] Tipo no manejado: ${email_action_type}`);
    }

    return NextResponse.json({});
  } catch (error) {
    console.error('[Auth Hook] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
