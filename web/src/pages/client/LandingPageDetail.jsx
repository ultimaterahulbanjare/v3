import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import Topbar from "../../components/Topbar.jsx"
import Spark from "../../components/Spark.jsx"
import DeployPanel from "../../components/DeployPanel.jsx"
import { api } from "../../lib/api.js"
import { fmt } from "../../lib/ui.js"

export default function LandingPageDetail(){
  const { id } = useParams()
  const [dateRange, setDateRange] = useState("7d")
  const [lp, setLp] = useState(null)
  const [metrics, setMetrics] = useState({visitors:0, preleads:0, joins:0})
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")

  useEffect(()=>{
    let alive=true
    ;(async ()=>{
      setLoading(true); setErr("")
      try{
        const [d, e] = await Promise.all([
          api.getLandingPage(id),
          api.getLandingPageEvents(id, 80)
        ])
        if(!alive) return
        setLp(d.landing_page)
        setMetrics(d.metrics || {visitors:0, preleads:0, joins:0})
        setEvents(e.events || [])
      }catch(ex){
        if(!alive) return
        setErr(ex.message || "Failed to load")
      }finally{
        if(alive) setLoading(false)
      }
    })()
    return ()=>{ alive=false }
  },[id])

  return (
    <div className="page">
      <Topbar title="LP Detail" dateRange={dateRange} setDateRange={setDateRange} />
      {err && <div className="card" style={{borderColor:"rgba(255,92,122,.35)", background:"rgba(255,92,122,.08)"}}>{err}</div>}

      <div className="grid">
        <div className="panel">
          <div className="panelHeader">
            <div>
              <h3>{lp?.name || "—"}</h3>
              <p>{lp?.channel_name ? `${lp.channel_name} · ${lp.tracking_profile_name}` : ""}</p>
            </div>
            {lp && <span className={"pill " + (lp.status==="active"?"good":"warn")}>{lp.status}</span>}
          </div>

          <div className="kpis">
            <div className="kpi">
              <div className="k">Visitors</div>
              <div className="v">{fmt(metrics.visitors || 0)}</div>
            </div>
            <div className="kpi">
              <div className="k">Pre-Leads</div>
              <div className="v">{fmt(metrics.preleads || 0)}</div>
            </div>
            <div className="kpi">
              <div className="k">Joins</div>
              <div className="v">{fmt(metrics.joins || 0)}</div>
            </div>
          </div>

          <div style={{marginTop:12}}>
            <Spark values={[Number(metrics.visitors||0), Number(metrics.preleads||0), Number(metrics.joins||0)]} />
          </div>
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div>
              <h3>Recent Events</h3>
              <p>LP scoped logs</p>
            </div>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Session</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="4" className="muted">Loading...</td></tr>}
              {!loading && events.length===0 && <tr><td colSpan="4" className="muted">No events</td></tr>}
              {events.map(ev=>(
                <tr key={ev.id}>
                  <td className="muted">{new Date(ev.ts).toLocaleString()}</td>
                  <td style={{fontWeight:800}}>{ev.type}</td>
                  <td className="muted">{ev.session_id || "—"}</td>
                  <td><span className="pill">{ev.status || "—"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {lp && <DeployPanel lp={lp} />}
    </div>
  )
}
