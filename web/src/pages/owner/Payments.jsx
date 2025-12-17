import React, { useEffect, useState } from "react"
import Topbar from "../../components/Topbar.jsx"
import { request } from "../../lib/api.js"

export default function Payments(){
  const [payments,setPayments]=useState([])
  const [err,setErr]=useState("")
  const [busyId,setBusyId]=useState("")

  async function load(){
    const res = await request("/owner/payments")
    setPayments(res.payments||[])
  }
  useEffect(()=>{ load().catch(e=>setErr(e.message||"Failed")) }, [])

  async function approve(id){
    setBusyId(id)
    try{
      await request(`/owner/payments/${id}/approve`, { method:"POST", body:{ months:1, enable_dedicated_bot:true }})
      await load()
    }catch(e){ setErr(e.message||"Failed") } finally{ setBusyId("")}
  }
  async function reject(id){
    setBusyId(id)
    try{
      await request(`/owner/payments/${id}/reject`, { method:"POST", body:{ note:"Rejected" }})
      await load()
    }catch(e){ setErr(e.message||"Failed") } finally{ setBusyId("")}
  }

  return (
    <div>
      <Topbar title="Payments" subtitle="Manual UPI approval queue" />
      {err ? <div className="authErr">{err}</div> : null}

      <div className="card">
        <div className="h2">Recent payments</div>
        <div style={{marginTop:10}}>
          {payments.map(p=>(
            <div key={p.id} className="listRow">
              <div style={{flex:1}}>
                <div style={{fontWeight:800}}>{p.client_name} • {p.plan} • ₹{p.amount_inr}</div>
                <div className="hint">Status: {p.status} • UTR: {p.txn_ref || "-"} • Created: {new Date(p.created_at).toLocaleString()}</div>
              </div>
              <div style={{display:"flex", gap:8}}>
                <button className="btnSmall" disabled={busyId===p.id || p.status!=="PENDING"} onClick={()=>approve(p.id)}>Approve</button>
                <button className="btnSmall" disabled={busyId===p.id || p.status!=="PENDING"} onClick={()=>reject(p.id)}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
