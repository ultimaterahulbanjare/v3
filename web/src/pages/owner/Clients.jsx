import React, { useEffect, useState } from "react"
import Topbar from "../../components/Topbar.jsx"
import { api } from "../../lib/api.js"

export default function Clients(){
  const [dateRange, setDateRange] = useState("30d")
  const [rows, setRows] = useState([])
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let alive=true
    ;(async ()=>{
      setLoading(true); setErr("")
      try{
        const d = await api.ownerGetClients()
        if(alive) setRows(d.clients || [])
      }catch(e){
        if(alive) setErr(e.message || "Failed to load clients")
      }finally{
        if(alive) setLoading(false)
      }
    })()
    return ()=>{ alive=false }
  },[])

  return (
    <div className="page">
      <Topbar title="Clients" dateRange={dateRange} setDateRange={setDateRange} />
      {err && <div className="card" style={{borderColor:"rgba(255,92,122,.35)", background:"rgba(255,92,122,.08)"}}>{err}</div>}

      <div className="panel">
        <div className="panelHeader">
          <div>
            <h3>All Clients</h3>
            <p>Total: {rows.length}</p>
          </div>
        </div>

        <table className="table">
          <thead><tr><th>Name</th><th>Plan</th><th>Status</th><th>Max Channels</th><th>Created</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="5" className="muted">Loading...</td></tr>}
            {!loading && rows.length===0 && <tr><td colSpan="5" className="muted">No clients</td></tr>}
            {rows.map(r=>(
              <tr key={r.id}>
                <td style={{fontWeight:800}}>{r.name}</td>
                <td className="muted">{r.plan}</td>
                <td><span className={"pill " + (r.status==="ACTIVE"?"good":"warn")}>{r.status}</span></td>
                <td>{r.max_channels}</td>
                <td className="muted">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
