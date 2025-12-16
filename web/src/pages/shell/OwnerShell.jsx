import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import Sidebar from "../../components/Sidebar.jsx"
import OwnerDashboard from "../owner/Dashboard.jsx"
import OwnerClients from "../owner/Clients.jsx"
import OwnerApprovals from "../owner/Approvals.jsx"
import OwnerLogs from "../owner/Logs.jsx"
import OwnerSettings from "../owner/Settings.jsx"

export default function OwnerShell(){
  return (
    <div className="container">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="clients" element={<OwnerClients />} />
          <Route path="approvals" element={<OwnerApprovals />} />
          <Route path="logs" element={<OwnerLogs />} />
          <Route path="settings" element={<OwnerSettings />} />
          <Route path="" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}
