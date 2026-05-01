import React, { useState } from 'react'
import { DISCOVERY_SEQUENCES } from '../data.js'
import { Card, SectionTitle, StepSequence, getColor } from '../components.jsx'

export default function DiscoveryGuide() {
  const [activeSeq, setActiveSeq] = useState(DISCOVERY_SEQUENCES[0].id)
  const seq = DISCOVERY_SEQUENCES.find((s) => s.id === activeSeq)

  return (
    <section aria-labelledby="discovery-heading">
      <h2 id="discovery-heading" className="sr-only">Discovery conversation sequences</h2>
      <SectionTitle>Discovery conversation sequences</SectionTitle>

      {/* Tab row */}
      <div
        role="tablist"
        aria-label="Select conversation sequence"
        style={{
          display: 'flex',
          gap: 0,
          marginBottom: 16,
          border: '1px solid var(--border)',
          borderRadius: 'var(--r)',
          overflow: 'hidden',
        }}
      >
        {DISCOVERY_SEQUENCES.map((s, i) => {
          const isActive = activeSeq === s.id
          const c = getColor(s.color)
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`seq-panel-${s.id}`}
              id={`seq-tab-${s.id}`}
              onClick={() => setActiveSeq(s.id)}
              style={{
                flex: 1,
                fontSize: 11,
                fontWeight: 500,
                padding: '9px 10px',
                cursor: 'pointer',
                background: isActive ? c.bg : 'none',
                border: 'none',
                borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                color: isActive ? c.text : 'var(--t2)',
                fontFamily: 'var(--fn)',
                transition: 'all .15s',
                textAlign: 'center',
              }}
            >
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Panel */}
      <div
        id={`seq-panel-${seq.id}`}
        role="tabpanel"
        aria-labelledby={`seq-tab-${seq.id}`}
      >
        <Card>
          <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 16, lineHeight: 1.6 }}>
            {seq.description}
          </p>
          <StepSequence steps={seq.steps} color={seq.color} />
        </Card>
      </div>
    </section>
  )
}
