const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept: 'application/json, text/plain, */*',
};

/**
 * GET /api/fundamentals?ticker=AAPL
 *
 * Fetches company fundamental and technical data from Yahoo Finance
 * using the publicly accessible chart and search APIs (no crumb required).
 *
 * Returns a normalized payload for the Investment Thesis tab and AI agent.
 * Returns { found: false, error } when the ticker is invalid or data is unavailable.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = (searchParams.get('ticker') || '').toUpperCase().trim();

  if (!ticker) {
    return Response.json({ found: false, error: 'ticker parameter is required' }, { status: 400 });
  }

  try {
    const [chartRes, searchRes] = await Promise.all([
      fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y&includePrePost=false`,
        { headers: YF_HEADERS }
      ),
      fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&quotesCount=1&newsCount=0`,
        { headers: YF_HEADERS }
      ),
    ]);

    if (!chartRes.ok) {
      return Response.json({ found: false, error: `Yahoo Finance returned ${chartRes.status} for ${ticker}` });
    }

    const chartJson = await chartRes.json();
    const chartResult = chartJson?.chart?.result?.[0];

    if (!chartResult) {
      return Response.json({ found: false, error: `No data found for ticker: ${ticker}` });
    }

    const meta = chartResult.meta || {};

    // Verify it's a traded equity, not a garbage ticker match
    if (!meta.regularMarketPrice) {
      return Response.json({ found: false, error: `Ticker ${ticker} has no market price data` });
    }

    // ── Historical closes for moving-average calculation ──────────────────
    const rawCloses = chartResult.indicators?.quote?.[0]?.close ?? [];
    const closes = rawCloses.filter(c => c != null);          // chronological order (oldest → newest)
    const ma50  = closes.length >= 50  ? avg(closes.slice(-50))  : null;
    const ma200 = closes.length >= 200 ? avg(closes.slice(-200)) : null;

    // ── Sector / Industry from search API ────────────────────────────────
    let sector = null;
    let industry = null;
    if (searchRes.ok) {
      try {
        const searchJson = await searchRes.json();
        const match = (searchJson?.quotes ?? []).find(
          q => q.symbol?.toUpperCase() === ticker && q.quoteType === 'EQUITY'
        );
        sector   = match?.sector   ?? null;
        industry = match?.industry ?? null;
      } catch { /* ignore parse errors */ }
    }

    const currentPrice = meta.regularMarketPrice;

    const payload = {
      found: true,
      ticker,
      company_name: meta.longName || meta.shortName || ticker,
      exchange:     meta.fullExchangeName || meta.exchangeName || '',
      currency:     meta.currency || 'USD',
      sector,
      industry,

      // ── Price ────────────────────────────────────────────────────────
      current_price:    currentPrice,
      price_change:     null,
      price_change_pct: null,
      market_cap:       null,  // not available without crumb

      // ── Valuation ────────────────────────────────────────────────────
      pe_ratio:        null,
      forward_pe:      null,
      price_to_book:   null,
      price_to_sales:  null,
      ev_to_ebitda:    null,
      eps:             null,
      eps_forward_est: null,
      peg_ratio:       null,

      // ── Profitability / quality ───────────────────────────────────────
      revenue:            null,
      revenue_growth:     null,
      gross_margin:       null,
      profit_margin:      null,
      ebitda_margin:      null,
      operating_margin:   null,
      return_on_equity:   null,
      return_on_assets:   null,
      free_cashflow:      null,
      operating_cashflow: null,
      total_cash:         null,
      total_debt:         null,
      debt_to_equity:     null,

      // ── Balance sheet / shareholder info ─────────────────────────────
      beta:               null,
      shares_outstanding: null,
      float_shares:       null,
      shares_short_pct:   null,
      dividend_yield:     null,
      payout_ratio:       null,
      book_value:         null,

      // ── Technical ────────────────────────────────────────────────────
      week52_high: meta.fiftyTwoWeekHigh ?? null,
      week52_low:  meta.fiftyTwoWeekLow  ?? null,
      ma50,
      ma200,
      day_high: meta.regularMarketDayHigh ?? null,
      day_low:  meta.regularMarketDayLow  ?? null,
      avg_volume: null,

      // ── Analyst consensus ─────────────────────────────────────────────
      analyst_rating:      null,
      analyst_target_mean: null,
      analyst_target_high: null,
      analyst_target_low:  null,
      analyst_count:       null,
      buy_count:           null,
      hold_count:          null,
      sell_count:          null,
      upside_pct:          null,
    };

    return Response.json(payload);

  } catch (err) {
    console.error(`[fundamentals] Error for ${ticker}:`, err.message);
    return Response.json({ found: false, error: err.message });
  }
}

function avg(arr) {
  if (!arr.length) return null;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}
