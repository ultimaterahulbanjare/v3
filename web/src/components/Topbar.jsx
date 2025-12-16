import React from "react"
export default function Topbar({ title, subtitle, dateRange, setDateRange, right=null }){
  return (
    <div className="topbar">
      <div className="pageTitle">
        <h2>{title}</h2>
        <span>{subtitle}</span>
      </div>
      <div className="topbarRight">
        {right}
        {dateRange && setDateRange ? (
          <select className="select" value={dateRange} onChange={(e)=>setDateRange(e.target.value)}>
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        ) : null}
      </div>
    </div>
  )
}
