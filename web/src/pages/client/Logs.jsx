import React, { useEffect, useState } from "react"
import Topbar from "../../components/Topbar.jsx"
import { api } from "../../lib/api.js"

export default function Logs(){
  const [dateRange, setDateRange] = useState("7d")
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")

  useEffect(()=>{
    let alive=true
    ;(async ()=>{
      setLoading(true); setErr("")
      try{
        const d = await api.getLogs(120)
        if(!alive) return
        setRows(d.events || [])
      }catch(e){
        if(!alive) return
        setErr(e.message || "Failed to load logs")
      }finally{
        if(alive) setLoading(false)
      }
    })()
    return ()=>{ alive=false }
  },[])

  return (
    <div className="page">
      <Topbar title="Logs" dateRange={dateRange} setDateRange={setDateRange} />
      {err && <div className="card" style={{borderColor:"rgba(255,92,122,.35)", background:"rgba(255,92,122,.08)"}}>{err}</div>}

      <div className="panel">
        <div className="panelHeader">
          <div>
            <h3>Event Logs</h3>
            <p>Last {rows.length} events</p>
          </div>
        </div>

        <table className="table">
          <thead><tr><th>Time</th><th>Type</th><th>Session</th><th>LP</th><th>Status</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="5" className="muted">Loading...</td></tr>}
            {!loading && rows.length===0 && <tr><td colSpan="5" className="muted">No events</td></tr>}
            {rows.map(r=>(
              <tr key={r.id}>
                <td className="muted">{new Date(r.ts).toLocaleString()}</td>
                <td style={{fontWeight:800}}>{r.type}</td>
                <td className="muted">{r.session_id || "—"}</td>
                <td className="muted">{r.landing_page_id ? String(r.landing_page_id).slice(0,8) : "—"}</td>
                <td><span className="pill">{r.status || "—"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
