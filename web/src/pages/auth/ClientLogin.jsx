import React, { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { loginClient, getMe } from "../../lib/api.js"

export default function ClientLogin(){
  const [email, setEmail] = useState("demo@client.com")
  const [password, setPassword] = useState("demo123")
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
      await loginClient(email, password)
      await getMe().catch(()=>{})
      nav(from || "/app/dashboard", { replace:true })
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
              <h1 style={{margin:"4px 0 0"}}>Client Login</h1>
              <div className="muted">Access your channels, LPs & analytics.</div>
            </div>
            <span className="pill">Client</span>
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
              <input className="input" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@domain.com" />
            </div>
            <div>
              <div className="label">Password</div>
              <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btnPrimary" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
            <div className="muted" style={{fontSize:12}}>
              Owner login is separate: <a className="link" href="/owner/login">/owner/login</a>
            </div>
          </form>
        </div>

        <div className="panel" style={{padding:18}}>
          <h3 style={{marginTop:0}}>Demo Credentials</h3>
          <div className="muted" style={{lineHeight:1.7}}>
            <div><b>Email:</b> demo@client.com</div>
            <div><b>Password:</b> demo123</div>
          </div>
          <div style={{marginTop:14}} className="card">
            <div style={{fontWeight:800}}>What you can test</div>
            <ul className="muted" style={{margin:"10px 0 0", paddingLeft:18, lineHeight:1.7}}>
              <li>Channels list + details</li>
              <li>Landing Pages list + LP detail analytics</li>
              <li>Tracking Profiles (Pixel+CAPI bundle)</li>
              <li>Logs (events)</li>
              <li>Export LP as HTML ZIP</li>
            </ul>
          </div>
        </div>
      </div>
        <div style={{marginTop:10, fontSize:13, opacity:.85}}>
          New here? <a href="/register">Create an account</a>
        </div>
    </div>
  )
}
