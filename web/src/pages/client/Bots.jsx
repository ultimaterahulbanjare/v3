import React, { useEffect, useState } from "react"
import Topbar from "../../components/Topbar.jsx"
import { request } from "../../lib/api.js"

export default function Bots(){
  const [bots,setBots]=useState([])
  const [name,setName]=useState("")
  const [token,setToken]=useState("")
  const [err,setErr]=useState("")
  const [msg,setMsg]=useState("")
  const [busy,setBusy]=useState(false)

  async function load(){
    const res = await request("/client/bots")
    setBots(res.bots||[])
  }
  useEffect(()=>{ load().catch(e=>setErr(e.message||"Failed")) }, [])

  async function create(){
    setBusy(true); setErr(""); setMsg("")
    try{
      const res = await request("/client/bots", { method:"POST", body:{ name, token }})
      setMsg("Dedicated bot saved. Map it to channels from your Channels page (coming next).")
      setName(""); setToken("")
      await load()
    }catch(e){
      setErr(e.message||"Failed")
    }finally{ setBusy(false) }
  }

  return (
    <div>
      <Topbar title="Telegram Bots" subtitle="Universal bot (default) + dedicated bots (add-on)" />

      <div className="card">
        <div className="h2">Active bots</div>
        <div style={{marginTop:10}}>
          {bots.map(b=>(
            <div key={b.id} className="listRow">
              <div>
                <div style={{fontWeight:750}}>{b.name}</div>
                <div className="hint">{b.type}</div>
              </div>
              <div className="pill">{b.is_active ? "Active" : "Disabled"}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{marginTop:14}}>
        <div className="h2">Add dedicated bot</div>
        <div className="hint">Requires MASTER_KEY on server to store token encrypted.</div>
        {err ? <div className="authErr">{err}</div> : null}
        {msg ? <div className="authOk">{msg}</div> : null}

        <div className="grid2" style={{marginTop:10}}>
          <div>
            <div className="label">Bot name</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Client Bot #1" />
          </div>
          <div>
            <div className="label">Bot token</div>
            <input value={token} onChange={e=>setToken(e.target.value)} placeholder="12345:AA..." />
          </div>
        </div>
        <button className="btnPrimary" onClick={create} disabled={busy || !name.trim() || !token.trim()} style={{marginTop:12}}>
          {busy ? "Saving..." : "Save Dedicated Bot"}
        </button>
      </div>
    </div>
  )
}
