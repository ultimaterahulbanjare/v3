import React, { useState } from "react"
import Topbar from "../../components/Topbar.jsx"

export default function OwnerLogs(){
  const [dateRange, setDateRange] = useState("24h")
  return (
    <>
      <Topbar title="System Logs" subtitle="Cross-tenant logs (UI placeholder)" dateRange={dateRange} setDateRange={setDateRange} />
      <div className="grid">
        <div className="panel">
          <div className="panelHeader"><div><h3>Logs</h3><p>Later: filter by tenant, severity, component</p></div></div>
          <div style={{color:"var(--muted)", fontSize:13, lineHeight:1.6}}>
            UI placeholder. Backend will stream structured logs here.
          </div>
        </div>
      </div>
    </>
  )
}
