import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Genera un captcha de texto aleatorio y devuelve el texto encriptado como token
export async function GET() {
  // Generar texto aleatorio: 6 caracteres alfanuméricos (sin caracteres ambiguos)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let captchaText = '';
  for (let i = 0; i < 6; i++) {
    captchaText += chars[Math.floor(Math.random() * chars.length)];
  }

  const secret = process.env.CAPTCHA_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret';
  
  // Crear token firmado con HMAC (texto + timestamp)
  const timestamp = Date.now();
  const payload = `${captchaText}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const token = Buffer.from(`${payload}:${hmac}`).toString('base64');

  // Generar SVG del captcha con distorsión visual
  const svg = generateCaptchaSVG(captchaText);

  return NextResponse.json({
    image: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    token,
  });
}

function generateCaptchaSVG(text: string): string {
  const width = 220;
  const height = 70;
  
  // Generar líneas de ruido
  let noise = '';
  for (let i = 0; i < 6; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    const color = `rgb(${100 + Math.random() * 100},${100 + Math.random() * 100},${100 + Math.random() * 100})`;
    noise += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5"/>`;
  }

  // Generar puntos de ruido
  for (let i = 0; i < 30; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    const r = 1 + Math.random() * 2;
    const color = `rgb(${150 + Math.random() * 100},${150 + Math.random() * 100},${150 + Math.random() * 100})`;
    noise += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`;
  }

  // Generar caracteres con rotación y posición variable
  let chars = '';
  const spacing = width / (text.length + 1);
  for (let i = 0; i < text.length; i++) {
    const x = spacing * (i + 0.7) + (Math.random() * 10 - 5);
    const y = 42 + (Math.random() * 16 - 8);
    const rotation = Math.random() * 30 - 15;
    const fontSize = 28 + Math.random() * 8;
    const color = `rgb(${Math.floor(Math.random() * 80)},${Math.floor(Math.random() * 80)},${Math.floor(Math.random() * 80)})`;
    chars += `<text x="${x}" y="${y}" font-size="${fontSize}" font-family="monospace" font-weight="bold" fill="${color}" transform="rotate(${rotation} ${x} ${y})">${text[i]}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#f0f0f0"/>
    ${noise}
    ${chars}
  </svg>`;
}
