import React from 'react'
import { SIGNALS } from '../data.js'
import { SectionTitle } from '../components.jsx'

const TIER_CONFIG = {
  1: { label: 'Tier 1', bg: 'var(--coral-light)', text: 'var(--coral)', dot: 'var(--coral)' },
  2: { label: 'Tier 2', bg: 'var(--amber-light)', text: 'var(--amber)', dot: 'var(--amber)' },
  3: { label: 'Tier 3', bg: 'var(--teal-light)',  text: 'var(--teal)',  dot: 'var(--teal)'  },
}

export default function BuyingSignals() {
  return (
    <section aria-labelledby="signals-heading">
      <h2 id="signals-heading" className="sr-only">Buying signals</h2>
      <SectionTitle>Buying signals — what to listen for and how to pivot</SectionTitle>

      <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 14, lineHeight: 1.6 }}>
        These signals appear in conversation. When you hear one, the opportunity is to pivot from transactional to strategic. Don't just note the signal — use it.
      </p>

      <div role="list" aria-label="Buying signals by tier">
        {SIGNALS.map((sig) => {
          const tier = TIER_CONFIG[sig.tier]
          return (
            <article
              key={sig.id}
              role="listitem"
              aria-label={`Tier ${sig.tier} signal: ${sig.label}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 'var(--r)',
                border: '1px solid var(--border)',
                marginBottom: 6,
                background: 'var(--surface)',
              }}
            >
              <div
                aria-hidden
                style={{
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: tier.dot,
                  flexShrink: 0,
                  marginTop: 5,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{sig.label}</div>
                <div style={{ fontSize: 11, color: 'var(--t2)', lineHeight: 1.5, marginBottom: 6 }}>{sig.text}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--t2)',
                    borderLeft: '2px solid var(--amber-mid)',
                    paddingLeft: 8,
                    lineHeight: 1.5,
                    fontStyle: 'italic',
                  }}
                >
                  {sig.pivot}
                </div>
              </div>
              <span
                aria-label={`${tier.label} priority`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 10,
                  fontWeight: 500,
                  padding: '3px 9px',
                  borderRadius: 20,
                  fontFamily: 'var(--mo)',
                  background: tier.bg,
                  color: tier.text,
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {tier.label}
              </span>
            </article>
          )
        })}
      </div>
    </section>
  )
}
