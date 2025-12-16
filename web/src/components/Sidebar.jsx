import React from "react"
import { NavLink, useNavigate } from "react-router-dom"
import Icon from "./Icon.jsx"
import { getAuth, logout } from "../lib/auth.js"

function Item({ to, icon, label }){
  return (
    <NavLink to={to} className={({isActive})=> isActive ? "active" : ""}>
      <Icon name={icon} />
      <span style={{fontSize:13, fontWeight:650}}>{label}</span>
    </NavLink>
  )
}

export default function Sidebar(){
  const a = getAuth()
  const role = a.role || "client"
  const navigate = useNavigate()

  const nav = role === "owner" ? [
    { section:"Overview" },
    { to:"/owner/dashboard", icon:"dashboard", label:"Dashboard" },
    { to:"/owner/clients", icon:"users", label:"Clients" },
    { to:"/owner/approvals", icon:"approve", label:"Approvals" },
    { section:"System" },
    { to:"/owner/logs", icon:"logs", label:"System Logs" },
    { to:"/owner/settings", icon:"settings", label:"Settings" },
  ] : [
    { section:"Overview" },
    { to:"/app/dashboard", icon:"dashboard", label:"Dashboard" },
    { section:"Build" },
    { to:"/app/lp-generator", icon:"ai", label:"AI LP Generator" },
    { to:"/app/landing-pages", icon:"lp", label:"Landing Pages" },
    { section:"Tracking" },
    { to:"/app/channels", icon:"channels", label:"Channels" },
    { to:"/app/tracking-profiles", icon:"profile", label:"Tracking Profiles" },
    { section:"Insights" },
    { to:"/app/reports", icon:"reports", label:"Reports" },
    { to:"/app/logs", icon:"logs", label:"Logs" },
    { section:"Account" },
    { to:"/app/settings", icon:"settings", label:"Settings" },
  ]

  const onLogout = ()=>{
    logout()
    navigate(role === "owner" ? "/owner/login" : "/login")
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo" />
        <div>
          <h1>Universal Tracking System</h1>
          <p>{role === "owner" ? "Owner Console" : "Client Workspace"}</p>
        </div>
      </div>

      <nav className="nav">
        {nav.map((it,idx)=>{
          if(it.section) return <div className="section" key={idx}>{it.section}</div>
          return <Item key={it.to} to={it.to} icon={it.icon} label={it.label} />
        })}
        <div style={{marginTop:10}}>
          <button className="btn btnGhost" onClick={onLogout} style={{width:"100%", display:"flex", gap:10, alignItems:"center", justifyContent:"center"}}>
            <Icon name="logout" /> Logout
          </button>
        </div>
      </nav>

      <div className="sidebarFooter">
        <div>
          <div style={{fontWeight:700, color:"rgba(234,240,255,.92)"}}>{a.user?.name || "Demo User"}</div>
          <div style={{marginTop:3}}>{role === "owner" ? "Owner" : "Client"} · <span className="badge">{a.user?.plan || (role==="owner"?"Owner":"Pro")}</span></div>
        </div>
      </div>
    </aside>
  )
}
