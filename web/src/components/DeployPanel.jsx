import React, { useState } from "react"
import { downloadExportZip } from "../lib/api.js"

export default function DeployPanel({ lp }){
  const [busy, setBusy] = useState(false)
  const onExport = async ()=>{
    setBusy(true)
    try{
      await downloadExportZip(lp.id)
    }catch(e){
      alert(e.message || "Export failed")
    }finally{
      setBusy(false)
    }
  }

  return (
    <div className="panel">
      <div className="panelHeader">
        <div>
          <h3>Deploy & Export</h3>
          <p>Launch LP directly from platform (ZIP export is live)</p>
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(12,1fr)", gap:12}}>
        <div className="card" style={{gridColumn:"span 4"}}>
          <h3>Netlify</h3>
          <div style={{fontWeight:800, fontSize:16}}>One-click deploy</div>
          <div style={{color:"var(--muted)", fontSize:13, lineHeight:1.6, marginTop:6}}>
            Auto build & publish LP on Netlify.
          </div>
          <div className="sub">
            <button className="btn btnPrimary" onClick={()=>alert("Netlify OAuth + deploy will be wired next.")}>Deploy to Netlify</button>
            <span className="pill warn">Coming soon</span>
          </div>
        </div>

        <div className="card" style={{gridColumn:"span 4"}}>
          <h3>GitHub</h3>
          <div style={{fontWeight:800, fontSize:16}}>Repo push</div>
          <div style={{color:"var(--muted)", fontSize:13, lineHeight:1.6, marginTop:6}}>
            Push LP code to your GitHub repository.
          </div>
          <div className="sub">
            <button className="btn btnPrimary" onClick={()=>alert("GitHub OAuth + push will be wired next.")}>Push to GitHub</button>
            <span className="pill warn">Coming soon</span>
          </div>
        </div>

        <div className="card" style={{gridColumn:"span 4"}}>
          <h3>Export HTML</h3>
          <div style={{fontWeight:800, fontSize:16}}>Download ZIP</div>
          <div style={{color:"var(--muted)", fontSize:13, lineHeight:1.6, marginTop:6}}>
            Use on any custom domain or hosting.
          </div>
          <div className="sub">
            <button className="btn btnPrimary" disabled={busy} onClick={onExport}>{busy ? "Preparing..." : "Download HTML"}</button>
            <span className="pill good">Live</span>
          </div>
        </div>
      </div>

      <div style={{marginTop:12, color:"var(--muted)", fontSize:12}}>
        ZIP export works now. GitHub/Netlify will require OAuth modules.
      </div>
    </div>
  )
}
