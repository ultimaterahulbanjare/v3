import React, { useState } from "react"
import Topbar from "../../components/Topbar.jsx"
import { mock } from "../../data/mock.js"
import { fmt } from "../../lib/ui.js"

export default function Reports(){
  const [dateRange, setDateRange] = useState("30d")
  const totals = mock.landingPages.reduce((a,lp)=>{ a.visitors+=lp.visitors; a.preleads+=lp.preleads; a.joins+=lp.joins; return a }, {visitors:0, preleads:0, joins:0})
  const rate = totals.visitors ? ((totals.joins/totals.visitors)*100).toFixed(2) : "0.00"
  return (
    <>
      <Topbar title="Reports" subtitle="High-level insights (UI)" dateRange={dateRange} setDateRange={setDateRange} />
      <div className="grid">
        <div className="card"><h3>Total visitors</h3><div className="value">{fmt(totals.visitors)}</div><div className="sub"><span className="pill">All LPs</span></div></div>
        <div className="card"><h3>Total pre-leads</h3><div className="value">{fmt(totals.preleads)}</div><div className="sub"><span className="pill">Captured</span></div></div>
        <div className="card"><h3>Total joins</h3><div className="value">{fmt(totals.joins)}</div><div className="sub"><span className={"pill "+(Number(rate)>=9?"good":"warn")}>{rate}% rate</span></div></div>
        <div className="card"><h3>Active LPs</h3><div className="value">{mock.landingPages.filter(x=>x.status==="Active").length}</div><div className="sub"><span className="pill good">Healthy</span></div></div>

        <div className="panel">
          <div className="panelHeader">
            <div>
              <h3>LP performance (summary)</h3>
              <p>Open a landing page to view deep analytics</p>
            </div>
            <button className="btn btnGhost">Export</button>
          </div>
          <table className="table">
            <thead><tr><th>LP</th><th>Visitors</th><th>Pre-leads</th><th>Joins</th><th>Rate</th></tr></thead>
            <tbody>
              {mock.landingPages.map(lp=>{
                const r = lp.visitors ? ((lp.joins/lp.visitors)*100).toFixed(1) : "0.0"
                return <tr key={lp.id}><td style={{fontWeight:800}}>{lp.name}</td><td>{fmt(lp.visitors)}</td><td>{fmt(lp.preleads)}</td><td>{fmt(lp.joins)}</td><td><span className={"pill "+(Number(r)>=9?"good":"warn")}>{r}%</span></td></tr>
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
