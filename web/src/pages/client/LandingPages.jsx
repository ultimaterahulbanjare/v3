import React, { useEffect, useState } from "react"
import Topbar from "../../components/Topbar.jsx"
import { useNavigate } from "react-router-dom"
import { api } from "../../lib/api.js"
import { fmt } from "../../lib/ui.js"

export default function LandingPages(){
  const nav = useNavigate()
  const [dateRange, setDateRange] = useState("7d")
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")

  useEffect(()=>{
    let alive=true
    ;(async ()=>{
      setLoading(true); setErr("")
      try{
        const d = await api.getLandingPages()
        if(!alive) return
        setRows(d.landing_pages || [])
      }catch(e){
        if(!alive) return
        setErr(e.message || "Failed to load LPs")
      }finally{
        if(alive) setLoading(false)
      }
    })()
    return ()=>{ alive=false }
  },[])

  return (
    <div className="page">
      <Topbar title="Landing Pages" dateRange={dateRange} setDateRange={setDateRange} />
      {err && <div className="card" style={{borderColor:"rgba(255,92,122,.35)", background:"rgba(255,92,122,.08)"}}>{err}</div>}

      <div className="panel">
        <div className="panelHeader">
          <div>
            <h3>Your LPs</h3>
            <p>Click an LP for detailed analytics + deploy/export</p>
          </div>
          <span className="pill">{rows.length}</span>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Channel</th>
              <th>Profile</th>
              <th>Visitors</th>
              <th>Pre-Leads</th>
              <th>Joins</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="7" className="muted">Loading...</td></tr>}
            {!loading && rows.length===0 && <tr><td colSpan="7" className="muted">No landing pages yet</td></tr>}
            {rows.map(lp=>(
              <tr key={lp.id} className="rowHover" onClick={()=>nav(`/app/landing-pages/${lp.id}`)}>
                <td style={{fontWeight:800}}>{lp.name}</td>
                <td className="muted">{lp.channel_name}</td>
                <td className="muted">{lp.tracking_profile_name}</td>
                <td>{fmt(lp.metrics?.visitors || 0)}</td>
                <td>{fmt(lp.metrics?.preleads || 0)}</td>
                <td>{fmt(lp.metrics?.joins || 0)}</td>
                <td><span className={"pill " + (lp.status==="active"?"good":"warn")}>{lp.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
