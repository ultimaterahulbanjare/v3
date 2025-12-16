import React from "react"
export default function Spark({ points=[3,4,2,6,5,7,6,8] }){
  const max = Math.max(...points, 1)
  const d = points.map((p,i)=>{
    const x = (i/(points.length-1))*100
    const y = 18 - (p/max)*18
    return `${x},${y}`
  }).join(" ")
  return (
    <svg width="96" height="22" viewBox="0 0 100 22" style={{opacity:.95}}>
      <polyline points={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
