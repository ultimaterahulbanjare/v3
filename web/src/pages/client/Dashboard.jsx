import React, { useEffect, useMemo, useState } from "react"
import Topbar from "../../components/Topbar.jsx"
import Spark from "../../components/Spark.jsx"
import { fmt } from "../../lib/ui.js"
import { api, getMe } from "../../lib/api.js"

export default function Dashboard(){
  const [dateRange, setDateRange] = useState("7d")
  const [me, setMe] = useState(null)
  const [landingPages, setLandingPages] = useState([])
  const [channels, setChannels] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")

  useEffect(()=>{
    let alive = true
    ;(async ()=>{
      setLoading(true); setErr("")
      try{
        const m = await getMe()
        const [ch, lp, tp] = await Promise.all([
          api.getChannels(),
          api.getLandingPages(),
          api.getTrackingProfiles()
        ])
        if(!alive) return
        setMe(m)
        setChannels(ch.channels || [])
        setLandingPages(lp.landing_pages || [])
        setProfiles(tp.tracking_profiles || [])
      }catch(e){
        if(!alive) return
        setErr(e.message || "Failed to load")
      }finally{
        if(alive) setLoading(false)
      }
    })()
    return ()=>{ alive=false }
  },[])

  const totals = useMemo(()=>{
    return landingPages.reduce((a,lp)=>{
      a.visitors += Number(lp.metrics?.visitors || 0)
      a.preleads += Number(lp.metrics?.preleads || 0)
      a.joins += Number(lp.metrics?.joins || 0)
      return a
    }, {visitors:0, preleads:0, joins:0})
  },[landingPages])

  return (
    <div className="page">
      <Topbar title="Dashboard" dateRange={dateRange} setDateRange={setDateRange} />
      {err && <div className="card" style={{borderColor:"rgba(255,92,122,.35)", background:"rgba(255,92,122,.08)"}}>{err}</div>}

      <div className="grid">
        <div className="panel">
          <div className="panelHeader">
            <div>
              <h3>Overview</h3>
              <p>{me?.client?.name || "Client"} · {me?.client?.plan || ""}</p>
            </div>
            <span className={"pill " + (me?.client?.status === "ACTIVE" ? "good":"warn")}>{me?.client?.status || "—"}</span>
          </div>

          <div className="kpis">
            <div className="kpi">
              <div className="k">Channels</div>
              <div className="v">{loading ? "—" : channels.length}</div>
            </div>
            <div className="kpi">
              <div className="k">Landing Pages</div>
              <div className="v">{loading ? "—" : landingPages.length}</div>
            </div>
            <div className="kpi">
              <div className="k">Tracking Profiles</div>
              <div className="v">{loading ? "—" : profiles.length}</div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div>
              <h3>Totals</h3>
              <p>Aggregated from all LPs</p>
            </div>
          </div>

          <div className="kpis">
            <div className="kpi">
              <div className="k">Visitors</div>
              <div className="v">{fmt(totals.visitors)}</div>
            </div>
            <div className="kpi">
              <div className="k">Pre-Leads</div>
              <div className="v">{fmt(totals.preleads)}</div>
            </div>
            <div className="kpi">
              <div className="k">Joins</div>
              <div className="v">{fmt(totals.joins)}</div>
            </div>
          </div>

          <div style={{marginTop:12}}>
            <Spark values={[totals.visitors, totals.preleads, totals.joins]} />
          </div>
        </div>
      </div>
    </div>
  )
}
