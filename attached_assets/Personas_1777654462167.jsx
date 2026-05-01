import React, { useState } from 'react'
import { PERSONAS } from '../data.js'
import { Card, SectionTitle, Divider, getColor } from '../components.jsx'

export default function Personas() {
  const [selected, setSelected] = useState(PERSONAS[0].id)
  const persona = PERSONAS.find((p) => p.id === selected)
  const c = getColor(persona.color)

  return (
    <section aria-labelledby="personas-heading">
      <h2 id="personas-heading" className="sr-only">Stakeholder personas</h2>
      <SectionTitle>Stakeholder personas — who you're in the room with</SectionTitle>

      {/* Persona selector */}
      <div
        role="tablist"
        aria-label="Select stakeholder persona"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 10,
          marginBottom: 20,
        }}
      >
        {PERSONAS.map((p) => {
          const pc = getColor(p.color)
          const isActive = selected === p.id
          return (
            <button
              key={p.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelected(p.id)}
              style={{
                background: isActive ? pc.bg : 'var(--surface)',
                border: `1px solid ${isActive ? pc.border : 'var(--border)'}`,
                borderRadius: 'var(--rl)',
                padding: 14,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all .15s',
                fontFamily: 'var(--fn)',
              }}
            >
              <div
                aria-hidden
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600, marginBottom: 10,
                  background: pc.bg, color: pc.text,
                  border: `1px solid ${pc.border}`,
                }}
              >
                {p.initials}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2, color: 'var(--t1)' }}>{p.name}</div>
              <div style={{ fontSize: 11, color: 'var(--t2)' }}>{p.role}</div>
            </button>
          )
        })}
      </div>

      {/* Detail panel */}
      <Card aria-live="polite" aria-label={`Persona details: ${persona.name}`}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div
            aria-hidden
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: c.bg, color: c.text,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, flexShrink: 0,
              border: `1px solid ${c.border}`,
            }}
          >
            {persona.initials}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{persona.name}</div>
            <div style={{ fontSize: 11, color: 'var(--t2)' }}>{persona.role}</div>
          </div>
        </div>

        <Divider />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 14 }}>
          <div>
            <SectionTitle style={{ marginBottom: 6 }}>What they care about</SectionTitle>
            <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>{persona.whatTheyCare}</p>
          </div>
          <div>
            <SectionTitle style={{ marginBottom: 6 }}>What keeps them up at night</SectionTitle>
            <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>{persona.whatKeepsThemUp}</p>
          </div>
        </div>

        <Divider />

        <div style={{ marginBottom: 14 }}>
          <SectionTitle style={{ marginBottom: 6 }}>Opening question</SectionTitle>
          <blockquote
            style={{
              background: 'var(--surface2)',
              borderLeft: `2px solid ${c.text}`,
              borderRadius: '0 var(--r) var(--r) 0',
              padding: '9px 12px',
              fontSize: 12, color: 'var(--t2)', fontStyle: 'italic', lineHeight: 1.6,
              margin: 0,
            }}
          >
            {persona.openingQuestion}
          </blockquote>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div>
            <SectionTitle style={{ marginBottom: 6 }}>What to avoid</SectionTitle>
            <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>{persona.avoid}</p>
          </div>
          <div>
            <SectionTitle style={{ marginBottom: 6 }}>Edge's angle</SectionTitle>
            <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>{persona.edgeAngle}</p>
          </div>
        </div>
      </Card>
    </section>
  )
}
