/**
 * GET /api/macro
 *
 * Returns live US macro indicators using publicly accessible sources:
 * - Yahoo Finance chart API (no auth) for market-based rates and indices
 * - BLS public API (no key) for unemployment and CPI
 *
 * Response shape:
 * {
 *   found: true,
 *   fetched_at: ISO string,
 *   indicators: {
 *     yield_10y:   { value, delta, label, unit },   // 10Y Treasury yield
 *     rates_short: { value, delta, label, unit },   // 13W T-Bill (Fed Funds proxy)
 *     sp500:       { value, delta, label, unit },   // S&P 500 index / 1Y performance
 *     vix:         { value, delta, label, unit },   // Volatility index
 *     unemployment:{ value, delta, label, unit },   // Unemployment rate (BLS)
 *     cpi_yoy:     { value, delta, label, unit },   // CPI YoY change (BLS)
 *   }
 * }
 */

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept: 'application/json, text/plain, */*',
};

const BLS_BASE = 'https://api.bls.gov/publicAPI/v2';
const BLS_V1_BASE = 'https://api.bls.gov/publicAPI/v1';

export async function GET() {
  try {
    const [yfResults, blsResult] = await Promise.all([
      fetchYahooMacro(),
      fetchBlsMacro(),
    ]);

    const indicators = { ...yfResults, ...blsResult };

    return Response.json({
      found: true,
      fetched_at: new Date().toISOString(),
      indicators,
    });

  } catch (err) {
    console.error('[macro] Error:', err.message);
    return Response.json({ found: false, error: err.message });
  }
}

// ── Yahoo Finance: market-based macro indicators ───────────────────────────
async function fetchYahooMacro() {
  const symbols = {
    yield_10y:   '%5ETNX',     // CBOE 10-year Treasury Note Yield
    rates_short: '%5EIRX',     // 13-week T-Bill yield (Fed Funds proxy)
    sp500:       '%5EGSPC',    // S&P 500
    vix:         '%5EVIX',     // Volatility Index
  };

  const results = await Promise.allSettled(
    Object.entries(symbols).map(async ([key, sym]) => {
      // Use 1-month range with weekly interval to get prior-period comparison
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1mo&includePrePost=false`;
      const res = await fetch(url, { headers: YF_HEADERS });
      if (!res.ok) return [key, null];
      const json = await res.json();
      const meta   = json.chart?.result?.[0]?.meta     ?? {};
      const closes = json.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(Boolean) ?? [];
      const value  = meta.regularMarketPrice ?? null;
      const prior  = closes.length >= 5 ? closes[closes.length - 6] ?? closes[0] : closes[0] ?? null;
      const delta  = value != null && prior != null ? value - prior : null;
      return [key, { value, delta, prior }];
    })
  );

  const raw = Object.fromEntries(results.map(r => (r.status === 'fulfilled' ? r.value : [null, null])).filter(([k]) => k));

  return {
    yield_10y: format(raw.yield_10y, '10Y Treasury Yield', '%', 2),
    rates_short: format(raw.rates_short, '13W T-Bill Yield', '%', 2),
    sp500: format(raw.sp500, 'S&P 500', '', 0),
    vix: format(raw.vix, 'VIX Volatility', '', 1),
  };
}

// ── BLS: unemployment and CPI ─────────────────────────────────────────────
// Strategy: try v2 multi-series POST (most efficient), retry up to 3 times
// with exponential backoff, then fall back to v1 single-series GETs.

async function fetchBlsMacro() {
  const NULL_RESULT = {
    unemployment: { value: null, delta: null, label: 'Unemployment Rate', unit: '%', period: null },
    cpi_yoy:      { value: null, delta: null, label: 'CPI YoY',           unit: '%', period: null },
  };

  // Attempt v2 multi-series with retries
  let v2Data = null;
  try {
    v2Data = await fetchWithRetry(() => fetchBlsV2(), 3, 800);
  } catch (err) {
    console.warn('[macro] BLS v2 failed after retries:', err.message);
  }

  if (v2Data) return v2Data;

  // Fallback: v1 single-series GETs (simpler, more permissive)
  console.info('[macro] Falling back to BLS v1 single-series endpoints');
  try {
    const v1Data = await fetchBlsV1Fallback();
    if (v1Data) return v1Data;
  } catch (err) {
    console.warn('[macro] BLS v1 fallback failed:', err.message);
  }

  return NULL_RESULT;
}

/**
 * Retry wrapper with exponential backoff + jitter.
 * Only retries on transient errors (network failures, timeouts, 5xx).
 * Deterministic 4xx errors are re-thrown immediately.
 * @param {() => Promise<T>} fn  — async function to retry
 * @param {number} maxAttempts
 * @param {number} baseDelayMs  — initial delay; doubles each attempt
 */
async function fetchWithRetry(fn, maxAttempts, baseDelayMs) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (err) {
      lastErr = err;
      // Don't retry deterministic 4xx failures
      const msg = err.message ?? '';
      const is4xx = /HTTP 4\d\d/.test(msg);
      if (is4xx) throw err;

      if (attempt < maxAttempts) {
        const base = baseDelayMs * Math.pow(2, attempt - 1);
        const jitter = Math.random() * base * 0.3;  // ±30% jitter
        const delay = Math.round(base + jitter);
        console.warn(`[macro] BLS attempt ${attempt} failed (${msg}); retrying in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

/** Single attempt at BLS v2 multi-series POST */
async function fetchBlsV2() {
  const currentYear = new Date().getFullYear().toString();
  const startYear   = (new Date().getFullYear() - 2).toString();

  const res = await fetch(`${BLS_BASE}/timeseries/data/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'STEEP-Analysis-Platform/1.0',
    },
    body: JSON.stringify({
      seriesid: ['LNS14000000', 'CUUR0000SA0'],
      startyear: startYear,
      endyear:   currentYear,
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`BLS v2 HTTP ${res.status}`);
  const json = await res.json();
  if (json.status !== 'REQUEST_SUCCEEDED') {
    throw new Error(`BLS v2 status: ${json.status} — ${(json.message ?? []).join('; ')}`);
  }

  return parseBLSSeries(json.Results?.series ?? []);
}

/** Fallback: BLS v1 single-series GETs (no key, simpler) */
async function fetchBlsV1Fallback() {
  const [unempRes, cpiRes] = await Promise.all([
    fetch(`${BLS_V1_BASE}/timeseries/data/LNS14000000`, {
      headers: { 'User-Agent': 'STEEP-Analysis-Platform/1.0' },
      signal: AbortSignal.timeout(8000),
    }),
    fetch(`${BLS_V1_BASE}/timeseries/data/CUUR0000SA0`, {
      headers: { 'User-Agent': 'STEEP-Analysis-Platform/1.0' },
      signal: AbortSignal.timeout(8000),
    }),
  ]);

  if (!unempRes.ok || !cpiRes.ok) {
    throw new Error(`BLS v1 HTTP errors: unemp=${unempRes.status} cpi=${cpiRes.status}`);
  }

  const [unempJson, cpiJson] = await Promise.all([unempRes.json(), cpiRes.json()]);

  if (unempJson.status !== 'REQUEST_SUCCEEDED' || cpiJson.status !== 'REQUEST_SUCCEEDED') {
    throw new Error('BLS v1 response status failed');
  }

  const series = [
    ...(unempJson.Results?.series ?? []),
    ...(cpiJson.Results?.series   ?? []),
  ];

  return parseBLSSeries(series);
}

/** Parse BLS series array into indicator objects */
function parseBLSSeries(series) {
  const unempSeries = series.find(s => s.seriesID === 'LNS14000000')?.data ?? [];
  const cpiSeries   = series.find(s => s.seriesID === 'CUUR0000SA0')?.data  ?? [];

  // Unemployment: latest vs prior month
  const unemp0 = safeNum(unempSeries[0]?.value);
  const unemp1 = safeNum(unempSeries[1]?.value);
  const unempDelta = unemp0 != null && unemp1 != null ? unemp0 - unemp1 : null;

  // CPI YoY: index 0 = most recent month, index 12 = same month last year
  const cpi0  = safeNum(cpiSeries[0]?.value);
  const cpi12 = safeNum(cpiSeries[12]?.value);
  const cpi1  = safeNum(cpiSeries[1]?.value);
  const cpiYoY = cpi0 != null && cpi12 != null ? ((cpi0 - cpi12) / cpi12) * 100 : null;
  const cpiMoM = cpi0 != null && cpi1  != null ? ((cpi0 - cpi1)  / cpi1)  * 100 : null;

  // Only return data if we got meaningful values
  if (unemp0 == null && cpiYoY == null) {
    throw new Error('BLS series parsed but all values are null');
  }

  return {
    unemployment: {
      value: unemp0,
      delta: unempDelta,
      label: 'Unemployment Rate',
      unit:  '%',
      period: unempSeries[0]?.periodName
        ? `${unempSeries[0].periodName} ${unempSeries[0].year}`
        : null,
    },
    cpi_yoy: {
      value: cpiYoY,
      delta: cpiMoM,
      label: 'CPI YoY',
      unit:  '%',
      period: cpiSeries[0]?.periodName
        ? `${cpiSeries[0].periodName} ${cpiSeries[0].year}`
        : null,
    },
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function format(raw, label, unit, decimals) {
  if (!raw) return { value: null, delta: null, prior: null, label, unit };
  return { value: raw.value, delta: raw.delta, prior: raw.prior, label, unit, decimals };
}

function safeNum(v) {
  if (v == null) return null;
  const n = Number(v);
  return isFinite(n) ? n : null;
}
