import React from 'react'

// ── Color helpers ──────────────────────────────────────────────
const COLOR_MAP = {
  coral: { bg: 'var(--coral-light)', text: 'var(--coral)', border: 'var(--coral-mid)' },
  teal:  { bg: 'var(--teal-light)',  text: 'var(--teal)',  border: 'var(--teal-mid)'  },
  amber: { bg: 'var(--amber-light)', text: 'var(--amber)', border: 'var(--amber-mid)' },
  purple:{ bg: 'var(--purple-light)',text: 'var(--purple)',border: 'var(--purple-mid)'},
}
export const getColor = (key) => COLOR_MAP[key] || COLOR_MAP.coral

// ── Badge ──────────────────────────────────────────────────────
export function Badge({ label, color = 'coral', style }) {
  const c = getColor(color)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 10,
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: 20,
        fontFamily: 'var(--mo)',
        background: c.bg,
        color: c.text,
        ...style,
      }}
    >
      {label}
    </span>
  )
}

// ── Tag ────────────────────────────────────────────────────────
export function Tag({ label, color = 'coral' }) {
  const c = getColor(color)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 10,
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: 20,
        fontFamily: 'var(--mo)',
        background: c.bg,
        color: c.text,
      }}
    >
      {label}
    </span>
  )
}

// ── Card ───────────────────────────────────────────────────────
export function Card({ children, style, ...rest }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--rl)',
        padding: 16,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

// ── SectionTitle ───────────────────────────────────────────────
export function SectionTitle({ children, style }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '.8px',
        color: 'var(--t3)',
        marginBottom: 12,
        fontFamily: 'var(--mo)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ── Divider ────────────────────────────────────────────────────
export function Divider({ style }) {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: '1px solid var(--border)',
        margin: '16px 0',
        ...style,
      }}
    />
  )
}

// ── ExpandItem (accordion) ─────────────────────────────────────
export function ExpandItem({ badge, badgeColor, header, children }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--r)',
        overflow: 'hidden',
        marginBottom: 6,
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '11px 14px',
          cursor: 'pointer',
          background: 'var(--surface2)',
          border: 'none',
          textAlign: 'left',
          transition: 'background .15s',
          fontFamily: 'var(--fn)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
      >
        {badge && <Badge label={badge} color={badgeColor} style={{ flexShrink: 0 }} />}
        <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--t1)', lineHeight: 1.4 }}>
          {header}
        </span>
        <span
          aria-hidden
          style={{
            fontSize: 14,
            color: 'var(--t3)',
            flexShrink: 0,
            fontFamily: 'var(--mo)',
            transform: open ? 'rotate(90deg)' : 'none',
            transition: 'transform .2s',
            display: 'inline-block',
          }}
        >
          ›
        </span>
      </button>
      {open && (
        <div style={{ padding: 14, borderTop: '1px solid var(--border)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── StepSequence ───────────────────────────────────────────────
export function StepSequence({ steps, color = 'coral' }) {
  const c = getColor(color)
  return (
    <ol style={{ listStyle: 'none' }} aria-label="Conversation steps">
      {steps.map((step, i) => (
        <li key={i} style={{ display: 'flex', gap: 12, paddingBottom: i < steps.length - 1 ? 16 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 26, flexShrink: 0 }}>
            <div
              aria-hidden
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 600,
                flexShrink: 0,
                border: `1px solid ${c.border}`,
                background: c.bg,
                color: c.text,
              }}
            >
              {step.num}
            </div>
            {i < steps.length - 1 && (
              <div aria-hidden style={{ flex: 1, width: 1, background: 'var(--border)', marginTop: 4 }} />
            )}
          </div>
          <div style={{ flex: 1, paddingTop: 2, paddingBottom: i < steps.length - 1 ? 0 : 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{step.title}</div>
            <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, marginBottom: step.prompt ? 8 : 0 }}>
              {step.text}
            </div>
            {step.prompt && (
              <blockquote
                style={{
                  background: 'var(--surface2)',
                  borderLeft: `2px solid var(--coral)`,
                  borderRadius: '0 4px 4px 0',
                  padding: '8px 11px',
                  fontSize: 11,
                  color: 'var(--t2)',
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                  margin: 0,
                }}
              >
                {step.prompt}
              </blockquote>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
