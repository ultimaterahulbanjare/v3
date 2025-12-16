import React, { useEffect, useState } from "react"
import Topbar from "../../components/Topbar.jsx"
import { api } from "../../lib/api.js"

export default function TrackingProfiles(){
  const [dateRange, setDateRange] = useState("7d")
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")
  const [form, setForm] = useState({ name:"", pixel_id:"", capi_token:"" })
  const [saving, setSaving] = useState(false)

  const load = async ()=>{
    const d = await api.getTrackingProfiles()
    setRows(d.tracking_profiles || [])
  }

  useEffect(()=>{
    let alive=true
    ;(async ()=>{
      setLoading(true); setErr("")
      try{
        await load()
      }catch(e){
        if(!alive) return
        setErr(e.message || "Failed to load profiles")
      }finally{
        if(alive) setLoading(false)
      }
    })()
    return ()=>{ alive=false }
  },[])

  const create = async (e)=>{
    e.preventDefault()
    setSaving(true); setErr("")
    try{
      await api.createTrackingProfile(form)
      setForm({ name:"", pixel_id:"", capi_token:"" })
      await load()
    }catch(ex){
      setErr(ex.message || "Failed to create")
    }finally{
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <Topbar title="Tracking Profiles" dateRange={dateRange} setDateRange={setDateRange} />
      {err && <div className="card" style={{borderColor:"rgba(255,92,122,.35)", background:"rgba(255,92,122,.08)"}}>{err}</div>}

      <div className="grid">
        <div className="panel">
          <div className="panelHeader">
            <div>
              <h3>Profiles (Pixel + CAPI)</h3>
              <p>Bundle is always together</p>
            </div>
            <span className="pill">{rows.length}</span>
          </div>

          <table className="table">
            <thead><tr><th>Name</th><th>Pixel</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="4" className="muted">Loading...</td></tr>}
              {!loading && rows.length===0 && <tr><td colSpan="4" className="muted">No profiles</td></tr>}
              {rows.map(r=>(
                <tr key={r.id}>
                  <td style={{fontWeight:800}}>{r.name}</td>
                  <td className="muted">{r.pixel_id}</td>
                  <td><span className={"pill " + (r.status==="ACTIVE"?"good":"warn")}>{r.status}</span></td>
                  <td className="muted">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div>
              <h3>Create Profile</h3>
              <p>Add new Pixel + CAPI bundle</p>
            </div>
          </div>

          <form onSubmit={create} style={{display:"grid", gap:10}}>
            <div>
              <div className="label">Name</div>
              <input className="input" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} placeholder="e.g. Cricket God Main" />
            </div>
            <div>
              <div className="label">Pixel ID</div>
              <input className="input" value={form.pixel_id} onChange={(e)=>setForm({...form, pixel_id:e.target.value})} placeholder="123..." />
            </div>
            <div>
              <div className="label">CAPI Token</div>
              <input className="input" value={form.capi_token} onChange={(e)=>setForm({...form, capi_token:e.target.value})} placeholder="EAA..." />
            </div>
            <button className="btn btnPrimary" disabled={saving}>{saving ? "Saving..." : "Create"}</button>
            <div className="muted" style={{fontSize:12}}>Token is stored server-side. UI never reads it back.</div>
          </form>
        </div>
      </div>
    </div>
  )
}
