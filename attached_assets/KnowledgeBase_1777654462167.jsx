import React, { useState } from 'react'
import {
  TECH_SEGMENTS,
  INDUSTRIES,
  PERSONA_ENRICHMENT,
  COMPETITIVE_INTEL,
  MARKET_SIGNALS,
} from '../knowledgeBase.js'
import { Card, SectionTitle, Divider, Badge, getColor } from '../components.jsx'

// ── Sub-nav tabs within the knowledge base ────────────────────
const KB_SECTIONS = [
  { id: 'segments',    label: 'Tech Segments'   },
  { id: 'industries',  label: 'Industries'      },
  { id: 'personas',    label: 'Persona Depth'   },
  { id: 'competitive', label: 'Competitive'     },
  { id: 'signals',     label: 'Market Signals'  },
  { id: 'firm',        label: 'Your Firm'  },
]

const URGENCY_CONFIG = {
  immediate: { label: 'Act now',   bg: 'var(--coral-light)', text: 'var(--coral)'  },
  'near-term':{ label: 'Near-term', bg: 'var(--amber-light)', text: 'var(--amber)'  },
  ongoing:   { label: 'Ongoing',   bg: 'var(--teal-light)',  text: 'var(--teal)'   },
}

const MATURITY_CONFIG = {
  'Core / Highest Maturity': { bg: 'var(--teal-light)',   text: 'var(--teal)'   },
  'Adult / High Maturity':   { bg: 'var(--teal-light)',   text: 'var(--teal)'   },
  'Sophomore / Growing Fast':{ bg: 'var(--amber-light)',  text: 'var(--amber)'  },
  'Early / High Potential':  { bg: 'var(--purple-light)', text: 'var(--purple)' },
  'Growing / Profitability Focus': { bg: 'var(--amber-light)', text: 'var(--amber)' },
}

// ── Shared pill component ─────────────────────────────────────
function Pill({ label, bg, text, style }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 500,
      padding: '2px 8px', borderRadius: 20,
      fontFamily: 'var(--mo)',
      background: bg, color: text,
      display: 'inline-block',
      ...style,
    }}>{label}</span>
  )
}

// ── Inline section label ──────────────────────────────────────
function SubLabel({ children }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '.7px', color: 'var(--t3)', fontFamily: 'var(--mo)',
      marginBottom: 5,
    }}>{children}</div>
  )
}

// ── Collapsible section ───────────────────────────────────────
function Collapsible({ title, children, defaultOpen = false, accentColor }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 12px', cursor: 'pointer',
          background: open ? 'var(--surface2)' : 'var(--surface)',
          border: '1px solid var(--border)',
          borderLeft: accentColor ? `3px solid ${accentColor}` : '1px solid var(--border)',
          borderRadius: 'var(--r)',
          textAlign: 'left', fontFamily: 'var(--fn)',
          transition: 'background .15s',
        }}
      >
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.3 }}>{title}</span>
        <span aria-hidden style={{
          fontSize: 13, color: 'var(--t3)',
          transform: open ? 'rotate(90deg)' : 'none',
          transition: 'transform .2s', display: 'inline-block',
        }}>›</span>
      </button>
      {open && (
        <div style={{
          border: '1px solid var(--border)', borderTop: 'none',
          borderRadius: '0 0 var(--r) var(--r)',
          padding: 14, background: 'var(--surface)',
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── List with accent dots ─────────────────────────────────────
function DotList({ items, dotColor = 'var(--t3)' }) {
  return (
    <ul style={{ listStyle: 'none' }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
          <span aria-hidden style={{
            width: 5, height: 5, borderRadius: '50%',
            background: dotColor, flexShrink: 0, marginTop: 6,
          }} />
          <span style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.55 }}>{item}</span>
        </li>
      ))}
    </ul>
  )
}

// ── TECH SEGMENTS SECTION ─────────────────────────────────────
function TechSegments() {
  const [active, setActive] = useState(TECH_SEGMENTS[0].id)
  const seg = TECH_SEGMENTS.find(s => s.id === active)
  const c = getColor(seg.color)

  return (
    <div>
      {/* Selector row */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {TECH_SEGMENTS.map(s => {
          const sc = getColor(s.color)
          const isActive = active === s.id
          return (
            <button key={s.id} onClick={() => setActive(s.id)}
              aria-pressed={isActive}
              style={{
                fontSize: 11, fontWeight: 500, padding: '7px 14px',
                borderRadius: 'var(--r)', cursor: 'pointer',
                border: '1px solid', fontFamily: 'var(--fn)',
                borderColor: isActive ? sc.border : 'var(--border2)',
                background: isActive ? sc.bg : 'none',
                color: isActive ? sc.text : 'var(--t2)',
                transition: 'all .15s',
              }}>
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Segment content */}
      <div aria-live="polite">
        <Card style={{ marginBottom: 10, borderLeft: `3px solid ${c.text}` }}>
          <div style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--t3)', marginBottom: 6 }}>{seg.tagline}</div>
          <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.65 }}>{seg.overview}</p>
        </Card>

        {/* Market dynamics */}
        <Collapsible title="Market dynamics & timing" accentColor={c.text} defaultOpen>
          <DotList items={seg.marketDynamics} dotColor={c.text} />
        </Collapsible>

        {/* Key categories */}
        <div style={{ marginBottom: 8 }}>
          <SectionTitle style={{ marginBottom: 10 }}>Key categories</SectionTitle>
          {seg.keyCategories.map((cat, i) => (
            <Collapsible key={i} title={cat.name} accentColor={c.text}>
              <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 10 }}>{cat.why}</p>
              {cat.vendors && (
                <div style={{ marginBottom: 10 }}>
                  <SubLabel>Key vendors</SubLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {cat.vendors.map((v, j) => (
                      <Pill key={j} label={v} bg="var(--surface2)" text="var(--t2)" />
                    ))}
                  </div>
                </div>
              )}
              {cat.edgeAngle && (
                <div style={{ background: c.bg, borderRadius: 'var(--r)', padding: '9px 12px' }}>
                  <SubLabel>Partner angle</SubLabel>
                  <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.55 }}>{cat.edgeAngle}</p>
                </div>
              )}
            </Collapsible>
          ))}
        </div>

        {/* Conversation starters */}
        <Collapsible title="Conversation starters" accentColor={c.text}>
          <ol style={{ listStyle: 'none' }}>
            {seg.conversationStarters.map((q, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: c.bg, color: c.text, border: `1px solid ${c.border}`,
                  fontSize: 9, fontWeight: 600, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>{i + 1}</span>
                <span style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.55, fontStyle: 'italic' }}>{q}</span>
              </li>
            ))}
          </ol>
        </Collapsible>

        {/* Landmines */}
        <Collapsible title="Landmines to avoid" accentColor="var(--coral)">
          <DotList items={seg.landmines} dotColor="var(--coral)" />
        </Collapsible>
      </div>
    </div>
  )
}

// ── INDUSTRIES SECTION ────────────────────────────────────────
function Industries() {
  const [active, setActive] = useState(INDUSTRIES[0].id)
  const ind = INDUSTRIES.find(i => i.id === active)
  const c = getColor(ind.color)

  return (
    <div>
      {/* Selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {INDUSTRIES.map(ind => {
          const ic = getColor(ind.color)
          const isActive = active === ind.id
          return (
            <button key={ind.id} onClick={() => setActive(ind.id)}
              aria-pressed={isActive}
              style={{
                fontSize: 11, fontWeight: 500, padding: '7px 14px',
                borderRadius: 'var(--r)', cursor: 'pointer',
                border: '1px solid', fontFamily: 'var(--fn)',
                borderColor: isActive ? ic.border : 'var(--border2)',
                background: isActive ? ic.bg : 'none',
                color: isActive ? ic.text : 'var(--t2)',
                transition: 'all .15s',
              }}>
              {ind.label}
            </button>
          )
        })}
      </div>

      <div aria-live="polite">
        {/* Credential bar */}
        {ind.edgeCredential && (
          <div style={{
            background: c.bg, border: `1px solid ${c.border}`,
            borderRadius: 'var(--r)', padding: '9px 12px', marginBottom: 10,
          }}>
            <SubLabel>Practice credential</SubLabel>
            <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>{ind.edgeCredential}</p>
          </div>
        )}

        <Card style={{ marginBottom: 10, borderLeft: `3px solid ${c.text}` }}>
          <div style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--t3)', marginBottom: 6 }}>{ind.tagline}</div>
          <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.65 }}>{ind.overview}</p>
        </Card>

        {/* Key pressures */}
        <Collapsible title="Key market pressures" accentColor={c.text} defaultOpen>
          <DotList items={ind.keyPressures} dotColor={c.text} />
        </Collapsible>

        {/* Technology priorities */}
        {ind.technologyPriorities && (
          <Collapsible title="Technology investment priorities" accentColor={c.text}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ind.technologyPriorities.map((tp, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, padding: '9px 11px',
                  background: 'var(--surface2)', borderRadius: 'var(--r)',
                  border: '1px solid var(--border)',
                }}>
                  <Pill
                    label={tp.urgency === 'high' ? 'High' : 'Medium'}
                    bg={tp.urgency === 'high' ? 'var(--coral-light)' : 'var(--amber-light)'}
                    text={tp.urgency === 'high' ? 'var(--coral)' : 'var(--amber)'}
                    style={{ alignSelf: 'flex-start', flexShrink: 0, marginTop: 1 }}
                  />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{tp.area}</div>
                    <div style={{ fontSize: 11, color: 'var(--t2)', lineHeight: 1.5 }}>{tp.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Collapsible>
        )}

        {/* Persona map */}
        {ind.personaMap && (
          <Collapsible title="Stakeholder map for this industry" accentColor={c.text}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(ind.personaMap).map(([role, desc], i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Pill label={role} bg={c.bg} text={c.text} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>{desc}</span>
                </div>
              ))}
            </div>
          </Collapsible>
        )}

        {/* Edge talking points */}
        {ind.edgeTalkingPoints && (
          <Collapsible title="Edge-specific talking points" accentColor={c.text}>
            <ol style={{ listStyle: 'none' }}>
              {ind.edgeTalkingPoints.map((tp, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: c.bg, color: c.text, border: `1px solid ${c.border}`,
                    fontSize: 9, fontWeight: 600, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>{i + 1}</span>
                  <span style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.55, fontStyle: 'italic' }}>"{tp}"</span>
                </li>
              ))}
            </ol>
          </Collapsible>
        )}

        {/* Reference conversations */}
        {ind.referenceConversations && (
          <Collapsible title="Reference conversations to use" accentColor="var(--amber)">
            <DotList items={ind.referenceConversations} dotColor="var(--amber)" />
          </Collapsible>
        )}
      </div>
    </div>
  )
}

// ── PERSONA DEPTH SECTION ─────────────────────────────────────
function PersonaDepth() {
  const [active, setActive] = useState(PERSONA_ENRICHMENT[0].id)
  const persona = PERSONA_ENRICHMENT.find(p => p.id === active)
  const c = getColor(persona.color)

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {PERSONA_ENRICHMENT.map(p => {
          const pc = getColor(p.color)
          const isActive = active === p.id
          return (
            <button key={p.id} onClick={() => setActive(p.id)}
              aria-pressed={isActive}
              style={{
                fontSize: 11, fontWeight: 500, padding: '7px 14px',
                borderRadius: 'var(--r)', cursor: 'pointer',
                border: '1px solid', fontFamily: 'var(--fn)',
                borderColor: isActive ? pc.border : 'var(--border2)',
                background: isActive ? pc.bg : 'none',
                color: isActive ? pc.text : 'var(--t2)',
                transition: 'all .15s',
              }}>
              {p.label.split(' — ')[0]}
            </button>
          )
        })}
      </div>

      <div aria-live="polite">
        <Card style={{ marginBottom: 10, borderLeft: `3px solid ${c.text}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{persona.label}</div>
          <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.65 }}>{persona.roleEvolution}</p>
        </Card>

        {persona.languageThatLands && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 10 }}>
            <div style={{ background: 'var(--teal-light)', borderRadius: 'var(--r)', padding: 12 }}>
              <SubLabel>Language that lands</SubLabel>
              <DotList items={persona.languageThatLands} dotColor="var(--teal)" />
            </div>
            <div style={{ background: 'var(--coral-light)', borderRadius: 'var(--r)', padding: 12 }}>
              <SubLabel>Language to avoid</SubLabel>
              <DotList items={persona.languageToAvoid} dotColor="var(--coral)" />
            </div>
          </div>
        )}

        {persona.topChallenges2026 && (
          <Collapsible title="Top challenges in 2026" accentColor={c.text} defaultOpen>
            <DotList items={persona.topChallenges2026} dotColor={c.text} />
          </Collapsible>
        )}

        {persona.whatTheyReadAndWatch && (
          <Collapsible title="What they read and watch" accentColor="var(--t3)">
            <DotList items={persona.whatTheyReadAndWatch} />
          </Collapsible>
        )}

        {persona.framingFramework && (
          <Collapsible title="Framing framework" accentColor={c.text}>
            <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{persona.framingFramework}</p>
          </Collapsible>
        )}

        {persona.conversationAnchor && (
          <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 'var(--r)', padding: 12, marginTop: 10 }}>
            <SubLabel>Conversation anchor</SubLabel>
            <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, fontStyle: 'italic' }}>{persona.conversationAnchor}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── COMPETITIVE INTEL SECTION ─────────────────────────────────
function CompetitiveIntel() {
  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 14, lineHeight: 1.6 }}>
        Understand where Edge wins, where it is vulnerable, and how to position against the most common alternatives.
      </p>
      {COMPETITIVE_INTEL.map(comp => (
        <Collapsible key={comp.id} title={`vs. ${comp.competitor}`} accentColor="var(--coral)">
          <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 10 }}>{comp.profile}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 10 }}>
            <div style={{ background: 'var(--teal-light)', borderRadius: 'var(--r)', padding: 10 }}>
              <SubLabel>Edge wins here</SubLabel>
              <DotList items={comp.edgeWins} dotColor="var(--teal)" />
            </div>
            <div style={{ background: 'var(--coral-light)', borderRadius: 'var(--r)', padding: 10 }}>
              <SubLabel>Edge vulnerabilities</SubLabel>
              <DotList items={comp.edgeWeaknesses} dotColor="var(--coral)" />
            </div>
          </div>

          <div style={{ background: 'var(--amber-light)', borderRadius: 'var(--r)', padding: 10 }}>
            <SubLabel>Displacement language</SubLabel>
            <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, fontStyle: 'italic' }}>{comp.displacement}</p>
          </div>
        </Collapsible>
      ))}
    </div>
  )
}

// ── MARKET SIGNALS SECTION ────────────────────────────────────
function MarketSignals() {
  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 14, lineHeight: 1.6 }}>
        Live market conditions that create timely openings for Edge conversations. Use these to open strategic discussions, not just respond to RFQs.
      </p>
      {MARKET_SIGNALS.map(sig => {
        const urg = URGENCY_CONFIG[sig.urgency] || URGENCY_CONFIG.ongoing
        const c = getColor(sig.color)
        return (
          <Collapsible key={sig.id} title={sig.title} accentColor={c.text}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
              <Pill label={urg.label} bg={urg.bg} text={urg.text} />
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>{sig.affectedCustomers}</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 10 }}>{sig.summary}</p>
            <div style={{ background: c.bg, borderRadius: 'var(--r)', padding: '9px 12px' }}>
              <SubLabel>The opportunity</SubLabel>
              <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.55 }}>{sig.opportunity}</p>
            </div>
          </Collapsible>
        )
      })}
    </div>
  )
}

// ── EDGE REFERENCE SECTION ────────────────────────────────────
function EdgeReference() {
  return (
    <div>
      {/* Quick stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 8, marginBottom: 16,
      }}>
        {[
          { n: ref.companyProfile.founded, l: 'Founded'               },
          { n: ref.companyProfile.size,    l: 'Team size'             },
          { n: ref.companyProfile.avgCustomerTenure, l: 'Avg. customer tenure' },
          { n: ref.companyProfile.revenue, l: 'Annual revenue'        },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'var(--surface2)', borderRadius: 'var(--r)',
            padding: '11px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--mo)', color: 'var(--coral)', lineHeight: 1, marginBottom: 3 }}>{s.n}</div>
            <div style={{ fontSize: 10, color: 'var(--t2)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Core differentiators */}
      <Collapsible title="Core differentiators" accentColor="var(--coral)" defaultOpen>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ref.coreDifferentiators.map((d, i) => (
            <div key={i} style={{
              padding: '10px 12px', background: 'var(--surface2)',
              borderRadius: 'var(--r)', border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3, color: 'var(--coral)' }}>{d.title}</div>
              <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.55 }}>{d.detail}</div>
            </div>
          ))}
        </div>
      </Collapsible>

      {/* Practice areas */}
      <Collapsible title="Practice areas & maturity" accentColor="var(--teal)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ref.practiceAreas.map((p, i) => {
            const mc = MATURITY_CONFIG[p.maturity] || { bg: 'var(--surface2)', text: 'var(--t2)' }
            return (
              <div key={i} style={{
                padding: '10px 12px', background: 'var(--surface)',
                borderRadius: 'var(--r)', border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{p.name}</span>
                  <Pill label={p.maturity} bg={mc.bg} text={mc.text} />
                </div>
                <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, marginBottom: p.vendors ? 6 : 0 }}>{p.description}</p>
                {p.vendors && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {p.vendors.map((v, j) => <Pill key={j} label={v} bg="var(--surface2)" text="var(--t3)" />)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Collapsible>

      {/* Internal AI tools */}
      <Collapsible title="Internal AI tools (use as reference stories)" accentColor="var(--amber)">
        <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 10, lineHeight: 1.55 }}>
          These are examples of internal AI tools built to solve real operational problems — legitimate proof of applied AI capability that reps can reference in customer conversations.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ref.internalAITools.map((tool, i) => (
            <div key={i} style={{
              padding: '9px 12px', background: 'var(--amber-light)',
              borderRadius: 'var(--r)', border: '1px solid var(--amber-mid)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber)', marginBottom: 2 }}>{tool.name}</div>
              <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>{tool.description}</div>
            </div>
          ))}
        </div>
      </Collapsible>

      {/* GTM priorities */}
      <Collapsible title="2026 GTM priorities" accentColor="var(--purple)">
        <DotList items={ref.gtmPriorities2026} dotColor="var(--purple)" />
      </Collapsible>
    </div>
  )
}

// ── ROOT COMPONENT ────────────────────────────────────────────
export default function KnowledgeBase() {
  const [activeSection, setActiveSection] = useState('segments')

  const SECTION_COMPONENTS = {
    segments:    TechSegments,
    industries:  Industries,
    personas:    PersonaDepth,
    competitive: CompetitiveIntel,
    signals:     MarketSignals,
    edge:        EdgeReference,
  }
  const ActiveComponent = SECTION_COMPONENTS[activeSection]

  return (
    <section aria-labelledby="kb-heading">
      <h2 id="kb-heading" className="sr-only">Knowledge base</h2>
      <SectionTitle>Enterprise technology knowledge base</SectionTitle>

      {/* Sub-nav */}
      <div
        role="tablist"
        aria-label="Knowledge base sections"
        style={{
          display: 'flex', gap: 0, marginBottom: 16,
          border: '1px solid var(--border)',
          borderRadius: 'var(--r)', overflow: 'hidden',
          flexWrap: 'wrap',
        }}
      >
        {KB_SECTIONS.map((s, i) => {
          const isActive = activeSection === s.id
          return (
            <button key={s.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveSection(s.id)}
              style={{
                flex: '1 1 auto',
                fontSize: 11, fontWeight: 500, padding: '9px 12px',
                cursor: 'pointer',
                background: isActive ? 'var(--coral-light)' : 'none',
                border: 'none',
                borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                color: isActive ? 'var(--coral)' : 'var(--t2)',
                fontFamily: 'var(--fn)', transition: 'all .15s',
                textAlign: 'center', whiteSpace: 'nowrap',
              }}
            >
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div role="tabpanel" aria-live="polite">
        <ActiveComponent />
      </div>
    </section>
  )
}
