import React from 'react'
import { OBJECTIONS } from '../data.js'
import { SectionTitle, ExpandItem } from '../components.jsx'

export default function ObjectionHandler() {
  return (
    <section aria-labelledby="objections-heading">
      <h2 id="objections-heading" className="sr-only">Objection handler</h2>
      <SectionTitle>Objection handler — reframe and respond</SectionTitle>

      <div role="list" aria-label="Common objections and responses">
        {OBJECTIONS.map((obj) => (
          <div key={obj.id} role="listitem">
            <ExpandItem
              badge={obj.badgeLabel}
              badgeColor={obj.badgeColor}
              header={obj.objection}
            >
              <p style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8, lineHeight: 1.6 }}>
                {obj.context}
              </p>
              <blockquote
                style={{
                  background: 'var(--surface2)',
                  borderRadius: 'var(--r)',
                  padding: '9px 11px',
                  fontSize: 11,
                  color: 'var(--t2)',
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                  margin: 0,
                  borderLeft: '3px solid var(--coral)',
                }}
              >
                {obj.response}
              </blockquote>
            </ExpandItem>
          </div>
        ))}
      </div>
    </section>
  )
}
