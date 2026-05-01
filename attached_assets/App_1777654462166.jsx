import React, { useState } from 'react'
import TalkingPoints from './tabs/TalkingPoints.jsx'
import Personas from './tabs/Personas.jsx'
import DiscoveryGuide from './tabs/DiscoveryGuide.jsx'
import ObjectionHandler from './tabs/ObjectionHandler.jsx'
import BuyingSignals from './tabs/BuyingSignals.jsx'
import PreCallChecklist from './tabs/PreCallChecklist.jsx'
import KnowledgeBase from './tabs/KnowledgeBase.jsx'

const TABS = [
  { id: 'talking',    label: 'Talking Points',      Component: TalkingPoints    },
  { id: 'personas',   label: 'Stakeholder Personas', Component: Personas         },
  { id: 'discovery',  label: 'Discovery Guide',      Component: DiscoveryGuide   },
  { id: 'objections', label: 'Objection Handler',    Component: ObjectionHandler },
  { id: 'signals',    label: 'Buying Signals',       Component: BuyingSignals    },
  { id: 'checklist',  label: 'Pre-Call Checklist',   Component: PreCallChecklist },
  { id: 'knowledge',  label: 'Knowledge Base',       Component: KnowledgeBase    },
]

const PRACTICE_BADGES = ['Healthcare', 'Cybersecurity', 'AI / Infrastructure']
const BADGE_COLORS = { Healthcare: 'var(--coral)', Cybersecurity: 'var(--teal)', 'AI / Infrastructure': 'var(--amber)' }
const BADGE_BG    = { Healthcare: 'var(--coral-light)', Cybersecurity: 'var(--teal-light)', 'AI / Infrastructure': 'var(--amber-light)' }

export default function App() {
  const [activeTab, setActiveTab] = useState('talking')
  const { Component } = TABS.find((t) => t.id === activeTab)

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <header style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', padding:'14px 20px', display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:100 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:10, fontWeight:500, color:'var(--t3)', fontFamily:'var(--mo)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:1 }}>
            Technology Sales
          </div>
          <div style={{ fontSize:15, fontWeight:600, color:'var(--t1)' }}>
            Sales <span style={{ color:'var(--coral)' }}>Elevation</span> System
          </div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          {PRACTICE_BADGES.map((b) => (
            <span key={b} style={{ fontSize:9, fontWeight:500, padding:'2px 7px', borderRadius:3, fontFamily:'var(--mo)', textTransform:'uppercase', letterSpacing:'.4px', background:BADGE_BG[b], color:BADGE_COLORS[b] }}>
              {b}
            </span>
          ))}
        </div>
      </header>

      <nav aria-label="Main navigation">
        <div role="tablist" aria-label="Tool sections" style={{ display:'flex', gap:0, padding:'0 20px', background:'var(--surface)', borderBottom:'1px solid var(--border)', overflowX:'auto' }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button key={tab.id} role="tab" aria-selected={isActive} aria-controls={`panel-${tab.id}`} id={`tab-${tab.id}`} onClick={() => setActiveTab(tab.id)}
                style={{ fontSize:12, fontWeight:500, padding:'10px 14px', cursor:'pointer', background:'none', border:'none', borderBottom: isActive ? '2px solid var(--coral)' : '2px solid transparent', color: isActive ? 'var(--coral)' : 'var(--t2)', fontFamily:'var(--fn)', transition:'all .15s', whiteSpace:'nowrap', flexShrink:0 }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--t1)' }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--t2)' }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>

      <main id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`} style={{ padding:20, maxWidth:960, margin:'0 auto' }}>
        <Component />
      </main>
    </>
  )
}
