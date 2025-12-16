import React, { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { loginOwner, getMe } from "../../lib/api.js"

export default function OwnerLogin(){
  const [email, setEmail] = useState("owner@admin.com")
  const [password, setPassword] = useState("admin123")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const loc = useLocation()
  const from = loc.state?.from

  const onSubmit = async (e)=>{
    e.preventDefault()
    setError("")
    setLoading(true)
    try{
      await loginOwner(email, password)
      await getMe().catch(()=>{})
      nav(from || "/owner/dashboard", { replace:true })
    }catch(err){
      setError(err?.message || "Login failed")
    }finally{
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:"100vh", display:"grid", placeItems:"center", padding:18}}>
      <div style={{width:"min(980px, 100%)", display:"grid", gridTemplateColumns:"1.15fr .85fr", gap:14}}>
        <div className="panel" style={{padding:18}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10}}>
            <div>
              <div className="kicker">UTS</div>
              <h1 style={{margin:"4px 0 0"}}>Owner Login</h1>
              <div className="muted">Manage clients, approvals & audit logs.</div>
            </div>
            <span className="pill warn">Owner</span>
          </div>

          {error && (
            <div className="card" style={{borderColor:"rgba(255,92,122,.35)", background:"rgba(255,92,122,.08)", marginBottom:12}}>
              <div style={{fontWeight:800}}>Login failed</div>
              <div className="muted" style={{marginTop:6}}>{error}</div>
            </div>
          )}

          <form onSubmit={onSubmit} style={{display:"grid", gap:10}}>
            <div>
              <div className="label">Email</div>
              <input className="input" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="owner@domain.com" />
            </div>
            <div>
              <div className="label">Password</div>
              <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btnPrimary" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
            <div className="muted" style={{fontSize:12}}>
              Client login is separate: <a className="link" href="/login">/login</a>
            </div>
          </form>
        </div>

        <div className="panel" style={{padding:18}}>
          <h3 style={{marginTop:0}}>Demo Owner</h3>
          <div className="muted" style={{lineHeight:1.7}}>
            <div><b>Email:</b> owner@admin.com</div>
            <div><b>Password:</b> admin123</div>
          </div>
          <div style={{marginTop:14}} className="card">
            <div style={{fontWeight:800}}>What you can test</div>
            <ul className="muted" style={{margin:"10px 0 0", paddingLeft:18, lineHeight:1.7}}>
              <li>Clients overview</li>
              <li>Approve / Reject clients</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
