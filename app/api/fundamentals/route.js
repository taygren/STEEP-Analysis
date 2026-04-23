const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept: 'application/json, text/plain, */*',
};

/**
 * GET /api/fundamentals?ticker=AAPL
 *
 * Fetches company data from Yahoo Finance using the publicly accessible
 * chart API (no crumb/auth required), search API (sector/industry), and
 * insights API (qualitative valuation + technical signals).
 *
 * Note: quantitative fundamentals (P/E, market cap, etc.) require the
 * quoteSummary endpoint which is rate-limited from cloud IPs. Those fields
 * remain null and are filled contextually by the AI thesis agent.
 *
 * Returns { found: false, error } when the ticker is invalid or unavailable.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = (searchParams.get('ticker') || '').toUpperCase().trim();

  if (!ticker) {
    return Response.json({ found: false, error: 'ticker parameter is required' }, { status: 400 });
  }

  try {
    const [chartRes, searchRes, insightsRes] = await Promise.all([
      fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y&includePrePost=false`,
        { headers: YF_HEADERS }
      ),
      fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&quotesCount=1&newsCount=0`,
        { headers: YF_HEADERS }
      ),
      fetch(
        `https://query2.finance.yahoo.com/ws/insights/v1/finance/insights?symbol=${encodeURIComponent(ticker)}`,
        { headers: YF_HEADERS }
      ).catch(() => null),
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

    // Verify it's a traded equity with price data
    if (!meta.regularMarketPrice) {
      return Response.json({ found: false, error: `Ticker ${ticker} has no market price data` });
    }

    // ── Historical closes for moving-average calculation ──────────────────
    const rawCloses = chartResult.indicators?.quote?.[0]?.close ?? [];
    const closes = rawCloses.filter(c => c != null);   // chronological (oldest → newest)
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

    // ── Qualitative signals from insights API ────────────────────────────
    let valuation_signal      = null;   // e.g. "Overvalued" | "Undervalued" | "Fairly Valued"
    let valuation_description = null;   // e.g. "6% discount"
    let valuation_relative    = null;   // e.g. "Premium" | "Discount"
    let tech_trend_short      = null;   // "up" | "down" | "neutral"
    let tech_trend_mid        = null;
    let tech_trend_long       = null;
    let tech_support          = null;
    let tech_resistance       = null;
    let tech_stop_loss        = null;

    if (insightsRes?.ok) {
      try {
        const insightsJson = await insightsRes.json();
        const info = insightsJson?.finance?.result?.instrumentInfo ?? {};
        const val  = info.valuation   ?? {};
        const kTec = info.keyTechnicals ?? {};
        const evts = info.technicalEvents ?? {};

        valuation_signal      = val.description  ?? null;
        valuation_description = val.discount      ?? null;
        valuation_relative    = val.relativeValue ?? null;
        tech_trend_short      = evts.shortTerm   ?? null;
        tech_trend_mid        = evts.midTerm     ?? null;
        tech_trend_long       = evts.longTerm    ?? null;
        tech_support          = kTec.support     ?? null;
        tech_resistance       = kTec.resistance  ?? null;
        tech_stop_loss        = kTec.stopLoss    ?? null;
      } catch { /* ignore */ }
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
      market_cap:       null,

      // ── Valuation (quantitative — not available without crumb) ────────
      pe_ratio:        null,
      forward_pe:      null,
      price_to_book:   null,
      price_to_sales:  null,
      ev_to_ebitda:    null,
      eps:             null,
      eps_forward_est: null,
      peg_ratio:       null,

      // ── Qualitative valuation signal (Trading Central via insights API) ─
      valuation_signal,       // "Overvalued" | "Undervalued" | "Fairly Valued"
      valuation_description,  // e.g. "6%"
      valuation_relative,     // "Premium" | "Discount"

      // ── Profitability / quality (not available without crumb) ─────────
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

      // ── Balance sheet (not available without crumb) ───────────────────
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

      // Technical signals from Trading Central (via insights API)
      tech_trend_short,   // "up" | "down" | "neutral"
      tech_trend_mid,
      tech_trend_long,
      tech_support,       // price level
      tech_resistance,    // price level
      tech_stop_loss,     // suggested stop-loss level

      // ── Analyst consensus (not available without crumb) ───────────────
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
