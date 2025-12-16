import React from "react"
import Topbar from "../../components/Topbar.jsx"

export default function Dashboard(){
  return (
    <div className="page">
      <Topbar title="Owner Dashboard" dateRange="30d" setDateRange={()=>{}} />
      <div className="panel">
        <div className="panelHeader">
          <div>
            <h3>Owner Panel</h3>
            <p>Use sidebar to manage clients & approvals.</p>
          </div>
        </div>
        <div className="card">
          <div style={{fontWeight:800}}>Ready</div>
          <div className="muted" style={{marginTop:6, lineHeight:1.7}}>
            Clients + Approvals are wired to backend.
          </div>
        </div>
      </div>
    </div>
  )
}
