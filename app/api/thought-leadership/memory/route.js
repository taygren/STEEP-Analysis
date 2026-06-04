import { NextResponse } from 'next/server';
import { kvGet, kvSet } from '../../../../lib/kv';

export const runtime = 'nodejs';

const DEFAULT_MEMORIES = [
  {
    id: 1,
    timestamp: "2026-06-02T10:14:00Z",
    source: "User Revision",
    detail: "Banned hedges: deleted 'could potentially indicate' from threat post. Calibrated voice engine to enforce strict declarative structures.",
    scope: "Tone Calibration"
  },
  {
    id: 2,
    timestamp: "2026-06-02T15:30:00Z",
    source: "GEO Validator",
    detail: "Statistic count fell below target (3 facts found, 4 required). System learned to fetch additional inline data indicators from Crunchbase.",
    scope: "GEO Optimization"
  },
  {
    id: 3,
    timestamp: "2026-06-03T09:12:00Z",
    source: "Editorial Correction",
    detail: "Removed present-participle sentence tail ('...highlighting the critical role'). Voice compiler now audits tail structure prior to Quality Gate.",
    scope: "Prohibited Patterns"
  },
  {
    id: 4,
    timestamp: "2026-06-03T14:45:00Z",
    source: "Correlation Loop",
    detail: "OT Security models connected to previous supply chain posts to prevent duplicate narratives. Semantic mapping adjusted to link back to post #12.",
    scope: "Topic Continuity"
  }
];

export async function GET() {
  try {
    let list = await kvGet('thought_leadership_memory_ledger');
    if (!list) {
      list = DEFAULT_MEMORIES;
      await kvSet('thought_leadership_memory_ledger', list);
    }
    return NextResponse.json({ found: true, memories: list });
  } catch (err) {
    console.error('[thought-leadership/memory] GET error:', err);
    return NextResponse.json({ found: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { detail, scope, source } = await req.json();

    if (!detail) {
      return NextResponse.json({ error: 'Detail is required' }, { status: 400 });
    }

    let list = await kvGet('thought_leadership_memory_ledger');
    if (!list) list = DEFAULT_MEMORIES;

    const newItem = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      source: source || 'User Input',
      detail,
      scope: scope || 'General'
    };

    list.unshift(newItem);
    await kvSet('thought_leadership_memory_ledger', list);

    return NextResponse.json({ success: true, item: newItem, memories: list });
  } catch (err) {
    console.error('[thought-leadership/memory] POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const clearItem = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      source: 'System Reset',
      detail: 'Memory ledger cleared. Enforcing master configuration parameters.',
      scope: 'System'
    };
    await kvSet('thought_leadership_memory_ledger', [clearItem]);
    return NextResponse.json({ success: true, memories: [clearItem] });
  } catch (err) {
    console.error('[thought-leadership/memory] DELETE error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
