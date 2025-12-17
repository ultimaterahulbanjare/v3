import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { request } from "../../lib/api.js"
import { setAuth } from "../../lib/auth.js"

export default function Register(){
  const nav = useNavigate()
  const [form, setForm] = useState({ name:"", email:"", password:"", plan:"Pro" })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")

  async function submit(e){
    e.preventDefault()
    setBusy(true); setErr("")
    try{
      const res = await request("/auth/register", { method:"POST", body: form })
      setAuth({
        loggedIn:true,
        access_token: res.access_token,
        role: res.role,
        user: res.user
      })
      nav("/app/billing", { replace:true })
    }catch(ex){
      setErr(ex.message || "Failed")
    }finally{
      setBusy(false)
    }
  }

  return (
    <div className="authWrap">
      <div className="authCard">
        <div className="authTitle">Create your account</div>
        <div className="authSub">Choose a plan, pay via UPI, then owner will activate.</div>
        {err ? <div className="authErr">{err}</div> : null}

        <form onSubmit={submit} className="authForm">
          <label>Name</label>
          <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Your company / channel brand" />

          <label>Email</label>
          <input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="you@example.com" />

          <label>Password</label>
          <input type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} placeholder="Minimum 6 chars" />

          <label>Plan</label>
          <select value={form.plan} onChange={e=>setForm({...form, plan:e.target.value})}>
            <option>Single</option>
            <option>Starter</option>
            <option>Pro</option>
            <option>Agency</option>
          </select>

          <button className="btnPrimary" disabled={busy}>{busy ? "Creating..." : "Create & Continue"}</button>
        </form>

        <div className="authFooter">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  )
}
