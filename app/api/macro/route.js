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

// ── BLS: unemployment and CPI (no API key required for single-series v1) ────
async function fetchBlsMacro() {
  try {
    // Fetch multiple series in one batch request (v2 supports multi-series)
    const res = await fetch(`${BLS_BASE}/timeseries/data/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'STEEP-Analysis-Platform/1.0' },
      body: JSON.stringify({
        seriesid: ['LNS14000000', 'CUUR0000SA0'],  // unemployment, CPI
        startyear: '2024',
        endyear:   '2026',
      }),
    });

    if (!res.ok) throw new Error(`BLS API returned ${res.status}`);
    const json = await res.json();
    if (json.status !== 'REQUEST_SUCCEEDED') throw new Error(`BLS error: ${json.status}`);

    const series = json.Results?.series ?? [];
    const unempSeries = series.find(s => s.seriesID === 'LNS14000000')?.data ?? [];
    const cpiSeries   = series.find(s => s.seriesID === 'CUUR0000SA0')?.data  ?? [];

    // Unemployment: latest vs prior month
    const unemp0 = safeNum(unempSeries[0]?.value);
    const unemp1 = safeNum(unempSeries[1]?.value);
    const unempDelta = unemp0 != null && unemp1 != null ? unemp0 - unemp1 : null;

    // CPI YoY: need 13 data points (current month + same month last year)
    // BLS returns newest-first; index 0 = most recent month, index 12 = same month last year
    const cpi0 = safeNum(cpiSeries[0]?.value);
    const cpi12 = safeNum(cpiSeries[12]?.value);
    const cpiYoY = cpi0 != null && cpi12 != null ? ((cpi0 - cpi12) / cpi12) * 100 : null;
    const cpiMoM = cpi0 != null && safeNum(cpiSeries[1]?.value) != null
      ? ((cpi0 - cpiSeries[1].value) / cpiSeries[1].value) * 100 : null;

    return {
      unemployment: {
        value: unemp0,
        delta: unempDelta,
        label: 'Unemployment Rate',
        unit: '%',
        period: unempSeries[0]?.periodName ? `${unempSeries[0].periodName} ${unempSeries[0].year}` : null,
      },
      cpi_yoy: {
        value: cpiYoY,
        delta: cpiMoM,   // delta = MoM change
        label: 'CPI YoY',
        unit: '%',
        period: cpiSeries[0]?.periodName ? `${cpiSeries[0].periodName} ${cpiSeries[0].year}` : null,
      },
    };

  } catch (err) {
    console.warn('[macro] BLS fetch failed:', err.message);
    return {
      unemployment: { value: null, delta: null, label: 'Unemployment Rate', unit: '%', period: null },
      cpi_yoy:      { value: null, delta: null, label: 'CPI YoY',           unit: '%', period: null },
    };
  }
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
