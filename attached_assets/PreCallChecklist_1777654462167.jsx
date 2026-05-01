import React, { useState, useEffect, useCallback } from 'react'
import { CHECKLIST_SECTIONS } from '../data.js'
import { SectionTitle } from '../components.jsx'

const STORAGE_KEY = 'edge_checklist_v1'

const allItemIds = CHECKLIST_SECTIONS.flatMap((s) => s.items.map((i) => i.id))

function loadChecked() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return new Set(JSON.parse(raw))
  } catch {}
  return new Set()
}

function saveChecked(set) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
  } catch {}
}

export default function PreCallChecklist() {
  const [checked, setChecked] = useState(loadChecked)

  const total = allItemIds.length
  const done = [...checked].filter((id) => allItemIds.includes(id)).length
  const pct = total ? Math.round((done / total) * 100) : 0

  const toggle = useCallback((id) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveChecked(next)
      return next
    })
  }, [])

  const reset = () => {
    setChecked(new Set())
    saveChecked(new Set())
  }

  return (
    <section aria-labelledby="checklist-heading">
      <h2 id="checklist-heading" className="sr-only">Pre-call preparation checklist</h2>
      <SectionTitle>Pre-call preparation checklist</SectionTitle>

      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div
          role="progressbar"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`${done} of ${total} items confirmed`}
          style={{ flex: 1, height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: 'var(--teal)',
              borderRadius: 2,
              transition: 'width .3s',
            }}
          />
        </div>
        <span
          aria-live="polite"
          aria-atomic
          style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--mo)', whiteSpace: 'nowrap' }}
        >
          {done} / {total}
        </span>
      </div>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        {CHECKLIST_SECTIONS.map((section) => (
          <div
            key={section.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--rl)',
              padding: 14,
            }}
          >
            <SectionTitle style={{ marginBottom: 10 }}>{section.label}</SectionTitle>
            <ul role="list" aria-label={section.label} style={{ listStyle: 'none' }}>
              {section.items.map((item) => {
                const isChecked = checked.has(item.id)
                return (
                  <li key={item.id} role="listitem">
                    <button
                      onClick={() => toggle(item.id)}
                      aria-pressed={isChecked}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '7px 8px',
                        borderRadius: 'var(--r)',
                        cursor: 'pointer',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        fontFamily: 'var(--fn)',
                        opacity: isChecked ? 0.5 : 1,
                        transition: 'background .15s, opacity .15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      <span
                        aria-hidden
                        style={{
                          width: 16, height: 16,
                          borderRadius: 3,
                          border: `1px solid ${isChecked ? 'var(--teal)' : 'var(--border2)'}`,
                          flexShrink: 0, marginTop: 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 600,
                          background: isChecked ? 'var(--teal)' : 'transparent',
                          color: 'white',
                          transition: 'all .15s',
                        }}
                      >
                        {isChecked ? '✓' : ''}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--t2)',
                          lineHeight: 1.4,
                          textDecoration: isChecked ? 'line-through' : 'none',
                        }}
                      >
                        {item.text}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Reset */}
      <div style={{ marginTop: 14, textAlign: 'center' }}>
        <button
          onClick={reset}
          style={{
            fontSize: 11, fontWeight: 500,
            padding: '7px 14px',
            borderRadius: 'var(--r)',
            border: '1px solid var(--border2)',
            background: 'none',
            color: 'var(--t2)',
            cursor: 'pointer',
            fontFamily: 'var(--fn)',
            transition: 'all .15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--t1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--t2)' }}
        >
          Reset checklist
        </button>
      </div>
    </section>
  )
}
