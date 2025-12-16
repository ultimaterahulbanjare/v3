import React, { useEffect, useState } from "react"
import Topbar from "../../components/Topbar.jsx"
import { useNavigate } from "react-router-dom"
import { api } from "../../lib/api.js"

export default function Channels(){
  const nav = useNavigate()
  const [dateRange, setDateRange] = useState("7d")
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")

  useEffect(()=>{
    let alive=true
    ;(async ()=>{
      setLoading(true); setErr("")
      try{
        const data = await api.getChannels()
        if(!alive) return
        setChannels(data.channels || [])
      }catch(e){
        if(!alive) return
        setErr(e.message || "Failed to load channels")
      }finally{
        if(alive) setLoading(false)
      }
    })()
    return ()=>{ alive=false }
  },[])

  return (
    <div className="page">
      <Topbar title="Channels" dateRange={dateRange} setDateRange={setDateRange} />
      {err && <div className="card" style={{borderColor:"rgba(255,92,122,.35)", background:"rgba(255,92,122,.08)"}}>{err}</div>}

      <div className="panel">
        <div className="panelHeader">
          <div>
            <h3>Your Channels</h3>
            <p>Click a channel to view LP-wise analytics</p>
          </div>
          <span className="pill">{channels.length}</span>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Telegram Chat ID</th>
              <th>Status</th>
              <th>Bot</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="4" className="muted">Loading...</td></tr>}
            {!loading && channels.length===0 && <tr><td colSpan="4" className="muted">No channels yet</td></tr>}
            {channels.map(ch=>(
              <tr key={ch.id} className="rowHover" onClick={()=>nav(`/app/channels/${ch.id}`)}>
                <td style={{fontWeight:800}}>{ch.name}</td>
                <td className="muted">{ch.telegram_chat_id}</td>
                <td><span className={"pill " + (ch.status==="ACTIVE"?"good":"warn")}>{ch.status}</span></td>
                <td><span className="pill">{ch.bot_mode}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
