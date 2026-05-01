import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 30;

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']);
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

function authCheck(req) {
  const token = process.env.ADMIN_PUBLISH_TOKEN;
  if (!token) return 'no_token';
  return req.headers.get('x-admin-token') === token ? 'ok' : 'unauthorized';
}

export async function POST(req) {
  const check = authCheck(req);
  if (check !== 'ok') {
    return NextResponse.json({ error: check === 'no_token' ? 'ADMIN_PUBLISH_TOKEN not configured' : 'Unauthorized' }, { status: check === 'no_token' ? 403 : 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('image');
    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported type. Use JPEG, PNG, GIF, WebP, or SVG.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: 'Image too large. Maximum 8 MB.' }, { status: 400 });
    }

    const rawName = file.name || 'image.jpg';
    const ext = rawName.includes('.') ? rawName.split('.').pop().toLowerCase() : 'jpg';
    const filename = `${randomUUID()}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));

    return NextResponse.json({ url: `/uploads/${filename}`, filename, size: bytes.byteLength });

  } catch (err) {
    console.error('[upload-image]', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
