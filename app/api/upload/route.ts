import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Allow large file uploads (up to 25MB body)
export const maxDuration = 30;

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

export async function POST(req: NextRequest) {
  try {
    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      console.error('Missing Cloudinary env vars:', { CLOUD_NAME: !!CLOUD_NAME, API_KEY: !!API_KEY, API_SECRET: !!API_SECRET });
      return NextResponse.json({ error: 'Configuración de Cloudinary incompleta' }, { status: 500 });
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (e) {
      console.error('Error parsing formData:', e);
      return NextResponse.json({ error: 'El archivo es demasiado grande o el formato es inválido. Máximo 10MB.' }, { status: 413 });
    }

    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'softworks';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido. Usa JPG, PNG, WebP, GIF, SVG o AVIF.' }, { status: 400 });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: `El archivo (${(file.size / 1024 / 1024).toFixed(1)}MB) excede el límite de 10MB.` }, { status: 400 });
    }

    // Generate signed upload params
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + API_SECRET)
      .digest('hex');

    // Build multipart form for Cloudinary
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('api_key', API_KEY);
    uploadData.append('timestamp', timestamp.toString());
    uploadData.append('signature', signature);
    uploadData.append('folder', folder);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: uploadData }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: `Cloudinary HTTP ${res.status}` } }));
      console.error('Cloudinary error:', err);
      return NextResponse.json({ error: err.error?.message || 'Error al subir imagen a Cloudinary' }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({
      url: data.secure_url,
      public_id: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
    });
  } catch (error) {
    console.error('Upload error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: `Error al subir: ${error instanceof Error ? error.message : 'Error desconocido'}` }, { status: 500 });
  }
}
