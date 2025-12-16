import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import Sidebar from "../../components/Sidebar.jsx"
import Dashboard from "../client/Dashboard.jsx"
import Channels from "../client/Channels.jsx"
import ChannelDetail from "../client/ChannelDetail.jsx"
import LandingPages from "../client/LandingPages.jsx"
import LandingPageDetail from "../client/LandingPageDetail.jsx"
import TrackingProfiles from "../client/TrackingProfiles.jsx"
import Reports from "../client/Reports.jsx"
import Logs from "../client/Logs.jsx"
import Settings from "../client/Settings.jsx"
import LpGenerator from "../client/LpGenerator.jsx"

export default function AppShell(){
  return (
    <div className="container">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="lp-generator" element={<LpGenerator />} />

          <Route path="channels" element={<Channels />} />
          <Route path="channels/:id" element={<ChannelDetail />} />

          <Route path="landing-pages" element={<LandingPages />} />
          <Route path="landing-pages/:id" element={<LandingPageDetail />} />

          <Route path="tracking-profiles" element={<TrackingProfiles />} />
          <Route path="reports" element={<Reports />} />
          <Route path="logs" element={<Logs />} />
          <Route path="settings" element={<Settings />} />
          <Route path="" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}
