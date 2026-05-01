import React, { useState } from 'react'
import { TALKING_POINTS } from '../data.js'
import { Tag, SectionTitle } from '../components.jsx'

const FILTERS = [
  { id: 'all',        label: 'All' },
  { id: 'cyber',      label: 'Cybersecurity' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'ai',         label: 'AI / Infrastructure' },
  { id: 'scale',      label: 'Scale & Growth' },
]

export default function TalkingPoints() {
  const [activeFilter, setActiveFilter] = useState('all')

  const visible = TALKING_POINTS.filter((tp) =>
    activeFilter === 'all' ? true : tp.cats.includes(activeFilter)
  )

  return (
    <section aria-labelledby="tp-heading">
      <h2 id="tp-heading" className="sr-only">Strategic talking points</h2>
      <SectionTitle>Strategic talking points — from transactional to executive</SectionTitle>

      {/* Filter bar */}
      <div
        role="toolbar"
        aria-label="Filter talking points by category"
        style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}
      >
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            aria-pressed={activeFilter === f.id}
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: '7px 14px',
              borderRadius: 'var(--r)',
              border: '1px solid',
              borderColor: activeFilter === f.id ? 'var(--coral-mid)' : 'var(--border2)',
              background: activeFilter === f.id ? 'var(--coral-light)' : 'none',
              color: activeFilter === f.id ? 'var(--coral)' : 'var(--t2)',
              cursor: 'pointer',
              fontFamily: 'var(--fn)',
              transition: 'all .15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div role="list" aria-label={`Talking points — ${FILTERS.find(f=>f.id===activeFilter)?.label}`}>
        {visible.map((tp) => (
          <article
            key={tp.id}
            role="listitem"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--rl)',
              padding: 14,
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
              <div
                aria-hidden
                style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--coral-light)',
                  border: '1px solid var(--coral-mid)',
                  color: 'var(--coral)',
                  fontSize: 9, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 1,
                }}
              >
                {tp.num}
              </div>
              <h3 style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4, flex: 1, color: 'var(--t1)' }}>
                {tp.title}
              </h3>
            </div>
            <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, paddingLeft: 32, marginBottom: 10 }}>
              {tp.body}
            </p>
            <div style={{ paddingLeft: 32, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {tp.tags.map((tag, i) => (
                <Tag key={i} label={tag} color={tp.tagColors[i] || 'coral'} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
