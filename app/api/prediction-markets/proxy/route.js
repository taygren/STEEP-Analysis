/**
 * POST /api/prediction-markets/proxy
 *
 * Server-side proxy to the Polymarket Gamma API.
 * Accepts { tags: string[] } and returns a merged array of market objects.
 *
 * Running server-side avoids browser CORS restrictions (Polymarket's Gamma API
 * does not set Access-Control-Allow-Origin for arbitrary origins like replit.dev).
 * Browser-like headers are sent to minimise Cloudflare JA3 friction.
 */

import { NextResponse } from 'next/server';

export const dynamic    = 'force-dynamic';
export const runtime    = 'nodejs';
export const maxDuration = 25;

const GAMMA_BASE = 'https://gamma-api.polymarket.com/markets';

const BROWSER_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':          'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer':         'https://polymarket.com/',
  'Origin':          'https://polymarket.com',
  'sec-ch-ua':       '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'sec-ch-ua-mobile':'?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest':  'empty',
  'sec-fetch-mode':  'cors',
  'sec-fetch-site':  'same-site',
};

async function fetchTag(tag) {
  const url = `${GAMMA_BASE}?tag=${encodeURIComponent(tag)}&limit=50&active=true&closed=false`;
  const res  = await fetch(url, { headers: BROWSER_HEADERS, next: { revalidate: 0 } });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function POST(req) {
  try {
    const { tags } = await req.json();
    if (!Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json({ error: 'tags array required' }, { status: 400 });
    }

    const usedTags = tags.slice(0, 6);
    const results  = await Promise.allSettled(usedTags.map(fetchTag));

    const dedupe = new Map();
    for (const r of results) {
      if (r.status === 'fulfilled') {
        for (const m of r.value) {
          if (m.id && !dedupe.has(m.id)) dedupe.set(m.id, m);
        }
      }
    }

    return NextResponse.json({ markets: [...dedupe.values()] });

  } catch (err) {
    console.error('[prediction-markets/proxy]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
