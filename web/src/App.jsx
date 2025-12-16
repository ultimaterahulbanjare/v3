import React from "react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import ClientLogin from "./pages/auth/ClientLogin.jsx"
import OwnerLogin from "./pages/auth/OwnerLogin.jsx"
import AppShell from "./pages/shell/AppShell.jsx"
import OwnerShell from "./pages/shell/OwnerShell.jsx"
import { getAuth } from "./lib/auth.js"

function RequireAuth({ children, role }){
  const a = getAuth()
  const loc = useLocation()
  if(!a.loggedIn) return <Navigate to={role === "owner" ? "/owner/login" : "/login"} replace state={{ from: loc.pathname }} />
  if(role && a.role !== role) return <Navigate to={a.role === "owner" ? "/owner/dashboard" : "/app/dashboard"} replace />
  return children
}

export default function App(){
  return (
    <Routes>
      <Route path="/login" element={<ClientLogin />} />
      <Route path="/owner/login" element={<OwnerLogin />} />

      <Route path="/app/*" element={<RequireAuth role="client"><AppShell /></RequireAuth>} />
      <Route path="/owner/*" element={<RequireAuth role="owner"><OwnerShell /></RequireAuth>} />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
