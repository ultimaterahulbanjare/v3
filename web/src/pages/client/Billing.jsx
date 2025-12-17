import React, { useEffect, useState } from "react"
import Topbar from "../../components/Topbar.jsx"
import { request } from "../../lib/api.js"

export default function Billing(){
  const [data,setData] = useState(null)
  const [txn,setTxn] = useState("")
  const [shot,setShot] = useState("")
  const [msg,setMsg] = useState("")
  const [err,setErr] = useState("")
  const [busy,setBusy] = useState(false)

  async function load(){
    const res = await request("/client/billing/status")
    setData(res)
  }

  useEffect(()=>{ load().catch(e=>setErr(e.message||"Failed")) }, [])

  async function submit(){
    setBusy(true); setErr(""); setMsg("")
    try{
      await request("/client/billing/submit-payment", { method:"POST", body:{ txn_ref: txn, screenshot_url: shot || undefined }})
      setMsg("Submitted! Owner will verify and activate.")
      setTxn(""); setShot("")
      await load()
    }catch(e){
      setErr(e.message||"Failed")
    }finally{
      setBusy(false)
    }
  }

  const p = data?.latest_payment

  return (
    <div>
      <Topbar title="Billing" subtitle="UPI payment + activation status" />

      <div className="card">
        <div className="row">
          <div>
            <div className="label">Account status</div>
            <div className="value">{data?.client_status || "-"}</div>
            <div className="hint">If status is PAST_DUE, features are locked until owner approves.</div>
          </div>
          <div>
            <div className="label">Subscription end</div>
            <div className="value">{data?.subscription_end ? new Date(data.subscription_end).toLocaleString() : "-"}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{marginTop:14}}>
        <div className="h2">Latest payment request</div>
        {p ? (
          <div className="grid2" style={{marginTop:10}}>
            <div>
              <div className="label">Plan</div>
              <div className="value">{p.plan}</div>
            </div>
            <div>
              <div className="label">Amount (INR)</div>
              <div className="value">₹{p.amount_inr}</div>
            </div>
            <div>
              <div className="label">UPI ID</div>
              <div className="value">{p.upi_id}</div>
            </div>
            <div>
              <div className="label">Status</div>
              <div className="value">{p.status}</div>
            </div>
          </div>
        ) : <div className="hint">No payment request found.</div>}

        <div className="divider" />

        <div className="h2">Submit payment</div>
        {err ? <div className="authErr">{err}</div> : null}
        {msg ? <div className="authOk">{msg}</div> : null}

        <div className="grid2" style={{marginTop:10}}>
          <div>
            <div className="label">Transaction / UTR</div>
            <input value={txn} onChange={e=>setTxn(e.target.value)} placeholder="UTR / Ref ID" />
          </div>
          <div>
            <div className="label">Screenshot URL (optional)</div>
            <input value={shot} onChange={e=>setShot(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <button className="btnPrimary" onClick={submit} disabled={busy || !txn.trim()} style={{marginTop:12}}>
          {busy ? "Submitting..." : "Submit for Approval"}
        </button>
      </div>
    </div>
  )
}
