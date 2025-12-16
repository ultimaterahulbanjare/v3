import React, { useState } from "react"
import Topbar from "../../components/Topbar.jsx"

export default function OwnerSettings(){
  const [dateRange, setDateRange] = useState("30d")
  return (
    <>
      <Topbar title="Owner Settings" subtitle="Global retention + plans (UI placeholder)" dateRange={dateRange} setDateRange={setDateRange} />
      <div className="grid">
        <div className="panel">
          <div className="panelHeader"><div><h3>Retention policy</h3><p>Default purge window after expiry</p></div><span className="pill">90 days</span></div>
          <div style={{color:"var(--muted)", fontSize:13, lineHeight:1.6}}>
            Later: set per-plan retention, export window, and auto purge jobs.
          </div>
        </div>
      </div>
    </>
  )
}
