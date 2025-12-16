import React, { useEffect, useState } from "react"
import Topbar from "../../components/Topbar.jsx"
import { getMe } from "../../lib/api.js"

export default function Settings(){
  const [dateRange, setDateRange] = useState("7d")
  const [me, setMe] = useState(null)
  const [err, setErr] = useState("")

  useEffect(()=>{
    let alive=true
    ;(async ()=>{
      try{
        const m = await getMe()
        if(alive) setMe(m)
      }catch(e){
        if(alive) setErr(e.message || "Failed to load")
      }
    })()
    return ()=>{ alive=false }
  },[])

  return (
    <div className="page">
      <Topbar title="Settings" dateRange={dateRange} setDateRange={setDateRange} />
      {err && <div className="card" style={{borderColor:"rgba(255,92,122,.35)", background:"rgba(255,92,122,.08)"}}>{err}</div>}

      <div className="panel">
        <div className="panelHeader">
          <div>
            <h3>Subscription</h3>
            <p>Plan & limits</p>
          </div>
          <span className={"pill " + (me?.client?.status==="ACTIVE" ? "good":"warn")}>{me?.client?.status || "—"}</span>
        </div>

        <div className="kpis">
          <div className="kpi">
            <div className="k">Plan</div>
            <div className="v">{me?.client?.plan || "—"}</div>
          </div>
          <div className="kpi">
            <div className="k">Max Channels</div>
            <div className="v">{me?.client?.max_channels ?? "—"}</div>
          </div>
          <div className="kpi">
            <div className="k">Max LPs</div>
            <div className="v">{me?.client?.max_landing_pages ?? "—"}</div>
          </div>
          <div className="kpi">
            <div className="k">Max Profiles</div>
            <div className="v">{me?.client?.max_tracking_profiles ?? "—"}</div>
          </div>
        </div>

        <div className="card" style={{marginTop:12}}>
          <div style={{fontWeight:800}}>Retention</div>
          <div className="muted" style={{marginTop:6, lineHeight:1.7}}>
            Data is stored while subscription is ACTIVE. If subscription expires and is not renewed, data is purged after the grace window.
          </div>
        </div>
      </div>
    </div>
  )
}
