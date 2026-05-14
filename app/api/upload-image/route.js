/**
 * POST /api/upload-image
 * Uploads an image to Supabase Storage (bucket: "uploads") and returns the
 * public URL.  Falls back to writing to public/uploads/ when running locally
 * (i.e. when SUPABASE_URL is not set) so the dev workflow stays the same.
 *
 * Requires:
 *   - Supabase bucket "uploads" created as PUBLIC in the Supabase dashboard
 *   - SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY env vars on Vercel
 *   - ADMIN_PUBLISH_TOKEN env var for auth
 */

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSupabase } from '../../../lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 30;

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
const BUCKET   = 'uploads';

function authCheck(req) {
  const token = process.env.ADMIN_PUBLISH_TOKEN;
  if (!token) return 'no_token';
  return req.headers.get('x-admin-token') === token ? 'ok' : 'unauthorized';
}

export async function POST(req) {
  const check = authCheck(req);
  if (check !== 'ok') {
    return NextResponse.json(
      { error: check === 'no_token' ? 'ADMIN_PUBLISH_TOKEN not configured' : 'Unauthorized' },
      { status: check === 'no_token' ? 403 : 401 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('image');
    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported type. Use JPEG, PNG, GIF, WebP, or SVG.' },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: 'Image too large. Maximum 8 MB.' }, { status: 400 });
    }

    const rawName = file.name || 'image.jpg';
    const ext      = rawName.includes('.') ? rawName.split('.').pop().toLowerCase() : 'jpg';
    const filename = `${randomUUID()}.${ext}`;
    const buffer   = Buffer.from(bytes);

    // ── Supabase Storage (production path) ──────────────────────────
    const sb = getSupabase();
    const { error: uploadErr } = await sb.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '31536000', // 1 year
      });

    if (uploadErr) {
      console.error('[upload-image] Supabase upload error:', uploadErr.message);
      throw new Error(uploadErr.message);
    }

    const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(filename);
    const publicUrl = urlData?.publicUrl;

    if (!publicUrl) throw new Error('Could not retrieve public URL from Supabase Storage');

    return NextResponse.json({ url: publicUrl, filename, size: bytes.byteLength });

  } catch (err) {
    console.error('[upload-image]', err.message);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
