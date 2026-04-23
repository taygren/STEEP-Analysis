/**
 * GET /api/sentiment?ticker=AAPL
 *
 * Fetches market sentiment signals from Adanos for Reddit, financial news, and X/Twitter.
 * Requires the ADANOS_API_KEY environment variable. Returns { found: false, reason: 'no_key' }
 * when the key is absent so callers degrade gracefully.
 *
 * Response shape (when found: true):
 * {
 *   found: true,
 *   ticker,
 *   composite_buzz: number,          // 0-100 overall buzz intensity
 *   composite_trend: 'rising'|'falling'|'stable',
 *   composite_sentiment_score: number, // -1 to +1  (-1 = bearish, +1 = bullish)
 *   composite_bullish_pct: number,   // 0-100
 *   composite_bearish_pct: number,
 *   trend_history: number[],         // buzz scores newest-first, up to 7 days
 *   platforms: [
 *     { name: 'Reddit', buzz: number, sentiment_score: number, bullish_pct: number, bearish_pct: number, mentions: number },
 *     { name: 'News',   buzz: number, sentiment_score: number, bullish_pct: number, bearish_pct: number, mentions: number },
 *     { name: 'X',      buzz: number, sentiment_score: number, bullish_pct: number, bearish_pct: number, mentions: number },
 *   ]
 * }
 */

const ADANOS_BASE = 'https://api.adanos.com';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = (searchParams.get('ticker') || '').toUpperCase().trim();

  if (!ticker) {
    return Response.json({ found: false, reason: 'missing_ticker' }, { status: 400 });
  }

  const apiKey = process.env.ADANOS_API_KEY;
  if (!apiKey) {
    return Response.json({ found: false, reason: 'no_key' });
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
    'User-Agent': 'STEEP-Analysis-Platform/1.0',
  };

  try {
    const [redditRes, newsRes, xRes] = await Promise.allSettled([
      fetch(`${ADANOS_BASE}/reddit/stocks/v1/stock/${encodeURIComponent(ticker)}`, { headers }),
      fetch(`${ADANOS_BASE}/news/stocks/v1/stock/${encodeURIComponent(ticker)}`, { headers }),
      fetch(`${ADANOS_BASE}/x/stocks/v1/stock/${encodeURIComponent(ticker)}`, { headers }).catch(() => null),
    ]);

    // Parse each platform; gracefully skip failures
    const reddit = await parsePlatform(redditRes, 'Reddit');
    const news   = await parsePlatform(newsRes,   'News');
    const x      = await parsePlatform(xRes,      'X');

    const activePlatforms = [reddit, news, x].filter(Boolean);

    if (activePlatforms.length === 0) {
      return Response.json({ found: false, reason: 'no_platform_data' });
    }

    // Composite metrics — weighted average across available platforms
    const composite_buzz = avg(activePlatforms.map(p => p.buzz));
    const composite_sentiment_score = avg(activePlatforms.map(p => p.sentiment_score));
    const composite_bullish_pct = avg(activePlatforms.map(p => p.bullish_pct));
    const composite_bearish_pct = avg(activePlatforms.map(p => p.bearish_pct));

    // Trend classification
    let composite_trend = 'stable';
    const redditTrend = reddit?.raw_trend ?? null;
    const newsTrend   = news?.raw_trend   ?? null;
    const risingCount = [redditTrend, newsTrend].filter(t => t === 'rising' || t === 'up').length;
    const fallingCount = [redditTrend, newsTrend].filter(t => t === 'falling' || t === 'down').length;
    if (risingCount > fallingCount) composite_trend = 'rising';
    else if (fallingCount > risingCount) composite_trend = 'falling';

    // Collect trend history from whichever platform has it
    const trend_history = reddit?.trend_history ?? news?.trend_history ?? [];

    return Response.json({
      found: true,
      ticker,
      composite_buzz,
      composite_trend,
      composite_sentiment_score,
      composite_bullish_pct,
      composite_bearish_pct,
      trend_history,
      platforms: activePlatforms.map(({ raw_trend, trend_history: _th, ...rest }) => rest),
    });

  } catch (err) {
    console.error(`[sentiment] Error for ${ticker}:`, err.message);
    return Response.json({ found: false, reason: 'fetch_error', error: err.message });
  }
}

/**
 * Parses an Adanos platform API response into a normalised object.
 * Returns null if the platform data is unavailable or errored.
 */
async function parsePlatform(settledResult, name) {
  if (!settledResult || settledResult.status === 'rejected') return null;
  const res = settledResult.value;
  if (!res || !res.ok) return null;

  let json;
  try { json = await res.json(); } catch { return null; }
  if (!json || json.error) return null;

  // Adanos response shape (approximate):
  // { buzz_score, trend, bullish_percentage, bearish_percentage, mentions, daily_buzz_history: [] }
  const buzz            = safeNum(json.buzz_score)          ?? safeNum(json.buzz)       ?? 0;
  const bullish_pct     = safeNum(json.bullish_percentage)  ?? safeNum(json.bullish_pct) ?? 50;
  const bearish_pct     = safeNum(json.bearish_percentage)  ?? safeNum(json.bearish_pct) ?? 50;
  const mentions        = safeNum(json.mentions)            ?? safeNum(json.mention_count) ?? 0;
  const raw_trend       = json.trend ?? json.direction ?? 'stable';
  const sentiment_score = bullish_pct / 100 - bearish_pct / 100; // -1 to +1

  const trend_history = (json.daily_buzz_history ?? json.buzz_history ?? [])
    .slice(0, 7)
    .map(v => (typeof v === 'object' ? safeNum(v.value ?? v.buzz ?? v.score) : safeNum(v)) ?? 0);

  return { name, buzz, sentiment_score, bullish_pct, bearish_pct, mentions, raw_trend, trend_history };
}

function safeNum(v) {
  if (v == null) return null;
  const n = Number(v);
  return isFinite(n) ? n : null;
}

function avg(arr) {
  const valid = arr.filter(v => v != null && isFinite(v));
  if (!valid.length) return 0;
  return valid.reduce((s, v) => s + v, 0) / valid.length;
}
