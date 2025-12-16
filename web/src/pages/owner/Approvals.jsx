import React, { useEffect, useState } from "react"
import Topbar from "../../components/Topbar.jsx"
import { api } from "../../lib/api.js"

export default function Approvals(){
  const [dateRange, setDateRange] = useState("30d")
  const [rows, setRows] = useState([])
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(true)

  const load = async ()=>{
    const d = await api.ownerGetApprovals()
    setRows(d.approvals || [])
  }

  useEffect(()=>{
    let alive=true
    ;(async ()=>{
      setLoading(true); setErr("")
      try{
        await load()
      }catch(e){
        if(alive) setErr(e.message || "Failed to load approvals")
      }finally{
        if(alive) setLoading(false)
      }
    })()
    return ()=>{ alive=false }
  },[])

  const approve = async (id)=>{
    try{
      await api.ownerApproveClient(id)
      await load()
    }catch(e){
      alert(e.message || "Approve failed")
    }
  }
  const reject = async (id)=>{
    try{
      await api.ownerRejectClient(id)
      await load()
    }catch(e){
      alert(e.message || "Reject failed")
    }
  }

  return (
    <div className="page">
      <Topbar title="Approvals" dateRange={dateRange} setDateRange={setDateRange} />
      {err && <div className="card" style={{borderColor:"rgba(255,92,122,.35)", background:"rgba(255,92,122,.08)"}}>{err}</div>}

      <div className="panel">
        <div className="panelHeader">
          <div>
            <h3>Pending / Expired</h3>
            <p>Approve or reject clients</p>
          </div>
        </div>

        <table className="table">
          <thead><tr><th>Name</th><th>Plan</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="4" className="muted">Loading...</td></tr>}
            {!loading && rows.length===0 && <tr><td colSpan="4" className="muted">No approvals</td></tr>}
            {rows.map(r=>(
              <tr key={r.id}>
                <td style={{fontWeight:800}}>{r.name}</td>
                <td className="muted">{r.plan}</td>
                <td><span className={"pill " + (r.status==="ACTIVE"?"good":"warn")}>{r.status}</span></td>
                <td style={{display:"flex", gap:8}}>
                  <button className="btn btnPrimary" onClick={()=>approve(r.id)}>Approve</button>
                  <button className="btn" onClick={()=>reject(r.id)}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
