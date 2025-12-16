import React, { useMemo, useState } from "react"
import Topbar from "../../components/Topbar.jsx"
import { mock } from "../../data/mock.js"

const presets = [
  { id:"p1", title:"Neon Conversion", hint:"Dark neon, big CTA, trust bullets" },
  { id:"p2", title:"Minimal Hero", hint:"Clean hero, proof cards, single CTA" },
  { id:"p3", title:"Split Layout", hint:"Left content, right signup card" },
]

export default function LpGenerator(){
  const [dateRange, setDateRange] = useState("30d")
  const [prompt, setPrompt] = useState("Create a premium landing page for a Telegram channel with high conversion. Include hero, features, proof, and a strong join CTA.")
  const [generated, setGenerated] = useState([])
  const [selectedChannel, setSelectedChannel] = useState(mock.channels[0].id)
  const [selectedProfile, setSelectedProfile] = useState(mock.trackingProfiles[0].id)

  const channel = useMemo(()=> mock.channels.find(c=>c.id===selectedChannel), [selectedChannel])
  const profile = useMemo(()=> mock.trackingProfiles.find(t=>t.id===selectedProfile), [selectedProfile])

  const onGenerate = ()=>{
    setGenerated([
      { id:"g1", name:"AI Template — Hero Neon", desc:"High contrast hero + proof + sticky CTA", score:"High" },
      { id:"g2", name:"AI Template — Card Funnel", desc:"Funnel steps + testimonial cards + FAQ", score:"Medium" },
      { id:"g3", name:"AI Template — Minimal Pro", desc:"Minimal layout, clean typography, fast scan", score:"High" },
    ])
  }

  return (
    <>
      <Topbar title="AI LP Generator" subtitle="Text box → OpenAI generates fresh LP designs (UI prototype)" dateRange={dateRange} setDateRange={setDateRange} />

      <div className="grid">
        <div className="panel split">
          <div>
            <div className="panelHeader">
              <div><h3>Prompt</h3><p>Later we’ll connect OpenAI API. Now: UI flow.</p></div>
              <span className="pill">OpenAI-ready</span>
            </div>

            <div style={{display:"grid", gap:10}}>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
                <select className="select" value={selectedChannel} onChange={(e)=>setSelectedChannel(e.target.value)}>
                  {mock.channels.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="select" value={selectedProfile} onChange={(e)=>setSelectedProfile(e.target.value)}>
                  {mock.trackingProfiles.map(t=> <option key={t.id} value={t.id}>{t.name} · {t.pixelId}</option>)}
                </select>
              </div>

              <textarea className="input" value={prompt} onChange={(e)=>setPrompt(e.target.value)} />

              <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
                {presets.map(p=>(
                  <button key={p.id} className="btn btnGhost" onClick={()=>setPrompt(`${p.hint}. ${prompt}`)}>
                    {p.title}
                  </button>
                ))}
              </div>

              <div style={{display:"flex", gap:10}}>
                <button className="btn btnPrimary" onClick={onGenerate}>Generate Designs</button>
                <button className="btn btnGhost">Import existing LP</button>
              </div>

              <div style={{color:"var(--muted)", fontSize:12, lineHeight:1.5}}>
                Selected: <b>{channel?.name}</b> · Tracking: <b>{profile?.name}</b> (Pixel+CAPI bundle)
              </div>
            </div>
          </div>

          <div>
            <div className="panelHeader">
              <div><h3>Flow</h3><p>Simple UX, strong backend later</p></div>
            </div>

            <div style={{display:"grid", gap:10}}>
              <div className="card" style={{background:"rgba(12,19,42,.55)"}}>
                <h3>1. User writes brief</h3>
                <div style={{color:"var(--muted)", fontSize:13, lineHeight:1.6}}>Niche, offer, style, language.</div>
              </div>
              <div className="card" style={{background:"rgba(12,19,42,.55)"}}>
                <h3>2. OpenAI generates</h3>
                <div style={{color:"var(--muted)", fontSize:13, lineHeight:1.6}}>Sections + copy variants + CTA text.</div>
              </div>
              <div className="card" style={{background:"rgba(12,19,42,.55)"}}>
                <h3>3. Publish + track</h3>
                <div style={{color:"var(--muted)", fontSize:13, lineHeight:1.6}}>Assign profile, deploy LP, show LP analytics.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div><h3>Generated designs</h3><p>Pick one → (future) auto-create LP + deploy</p></div>
          </div>

          {generated.length === 0 ? (
            <div style={{color:"var(--muted)", fontSize:13}}>No designs yet. Click “Generate Designs”.</div>
          ) : (
            <div style={{display:"grid", gridTemplateColumns:"repeat(12,1fr)", gap:12}}>
              {generated.map(g=>(
                <div key={g.id} className="card" style={{gridColumn:"span 4"}}>
                  <h3>{g.name}</h3>
                  <div style={{fontWeight:900, fontSize:16, marginTop:6}}>
                    Conversion score: <span className={"pill "+(g.score==="High"?"good":"warn")}>{g.score}</span>
                  </div>
                  <div style={{color:"var(--muted)", fontSize:13, lineHeight:1.6, marginTop:8}}>{g.desc}</div>
                  <div className="sub">
                    <button className="btn btnPrimary">Use this template</button>
                    <button className="btn btnGhost">Preview</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
