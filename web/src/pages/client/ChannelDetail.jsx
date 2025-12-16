import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Topbar from "../../components/Topbar.jsx"
import { api } from "../../lib/api.js"
import { fmt } from "../../lib/ui.js"

export default function ChannelDetail(){
  const { id } = useParams()
  const nav = useNavigate()
  const [dateRange, setDateRange] = useState("7d")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")

  useEffect(()=>{
    let alive=true
    ;(async ()=>{
      setLoading(true); setErr("")
      try{
        const d = await api.getChannel(id)
        if(!alive) return
        setData(d)
      }catch(e){
        if(!alive) return
        setErr(e.message || "Failed to load channel")
      }finally{
        if(alive) setLoading(false)
      }
    })()
    return ()=>{ alive=false }
  },[id])

  const channel = data?.channel
  const lps = data?.landing_pages || []

  return (
    <div className="page">
      <Topbar title="Channel Detail" dateRange={dateRange} setDateRange={setDateRange} />
      {err && <div className="card" style={{borderColor:"rgba(255,92,122,.35)", background:"rgba(255,92,122,.08)"}}>{err}</div>}

      <div className="panel">
        <div className="panelHeader">
          <div>
            <h3>{channel?.name || "—"}</h3>
            <p className="muted">{channel?.telegram_chat_id || ""}</p>
          </div>
          {channel && <span className={"pill " + (channel.status==="ACTIVE"?"good":"warn")}>{channel.status}</span>}
        </div>

        <h3 style={{marginTop:0}}>Landing Pages</h3>
        <table className="table">
          <thead>
            <tr>
              <th>LP</th>
              <th>Profile</th>
              <th>Visitors</th>
              <th>Pre-Leads</th>
              <th>Joins</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="5" className="muted">Loading...</td></tr>}
            {!loading && lps.length===0 && <tr><td colSpan="5" className="muted">No LPs for this channel</td></tr>}
            {lps.map(lp=>(
              <tr key={lp.id} className="rowHover" onClick={()=>nav(`/app/landing-pages/${lp.id}`)}>
                <td style={{fontWeight:800}}>{lp.name}</td>
                <td className="muted">{lp.tracking_profile_name}</td>
                <td>{fmt(lp.metrics?.visitors || 0)}</td>
                <td>{fmt(lp.metrics?.preleads || 0)}</td>
                <td>{fmt(lp.metrics?.joins || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
