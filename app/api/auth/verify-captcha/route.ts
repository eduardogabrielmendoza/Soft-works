import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutos

export async function POST(req: NextRequest) {
  try {
    const { token, answer } = await req.json();

    if (!token || !answer) {
      return NextResponse.json({ valid: false, error: 'Datos incompletos' }, { status: 400 });
    }

    const secret = process.env.CAPTCHA_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret';

    // Decodificar token
    let decoded: string;
    try {
      decoded = Buffer.from(token, 'base64').toString('utf-8');
    } catch {
      return NextResponse.json({ valid: false, error: 'Token inválido' }, { status: 400 });
    }

    const parts = decoded.split(':');
    if (parts.length !== 3) {
      return NextResponse.json({ valid: false, error: 'Token inválido' }, { status: 400 });
    }

    const [captchaText, timestampStr, providedHmac] = parts;
    const timestamp = parseInt(timestampStr, 10);

    // Verificar que no haya expirado
    if (Date.now() - timestamp > MAX_AGE_MS) {
      return NextResponse.json({ valid: false, error: 'El captcha ha expirado. Generá uno nuevo.' }, { status: 400 });
    }

    // Verificar HMAC
    const payload = `${captchaText}:${timestampStr}`;
    const expectedHmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    if (providedHmac !== expectedHmac) {
      return NextResponse.json({ valid: false, error: 'Token manipulado' }, { status: 400 });
    }

    // Comparar respuesta (case insensitive)
    const isValid = answer.toUpperCase().trim() === captchaText.toUpperCase();

    if (!isValid) {
      return NextResponse.json({ valid: false, error: 'Código incorrecto. Intentá de nuevo.' }, { status: 400 });
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ valid: false, error: 'Error del servidor' }, { status: 500 });
  }
}
