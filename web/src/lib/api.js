import { getAuth, setAuth, logout } from "./auth.js"

const API_BASE = import.meta.env.VITE_API_BASE || ""

async function request(path, { method="GET", body, headers={} } = {}){
  const a = getAuth()
  const h = { "Content-Type":"application/json", ...headers }
  if(a?.access_token) h["Authorization"] = `Bearer ${a.access_token}`

  const res = await fetch(API_BASE + path, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined
  })

  // If token invalid, logout
  if(res.status === 401){
    logout()
  }

  const ct = res.headers.get("content-type") || ""
  if(ct.includes("application/json")){
    const data = await res.json().catch(()=>null)
    if(!res.ok){
      const msg = data?.error || `Request failed (${res.status})`
      throw new Error(msg)
    }
    return data
  }else{
    // non-json
    if(!res.ok) throw new Error(`Request failed (${res.status})`)
    return res
  }
}

export async function loginClient(email, password){
  const data = await request("/auth/login", { method:"POST", body:{ email, password } })
  setAuth({ loggedIn:true, role:"client", access_token:data.access_token })
  return data
}

export async function loginOwner(email, password){
  const data = await request("/auth/owner/login", { method:"POST", body:{ email, password } })
  setAuth({ loggedIn:true, role:"owner", access_token:data.access_token })
  return data
}

export async function getMe(){
  return request("/me")
}

export const api = {
  request,
  getChannels: ()=>request("/client/channels"),
  getChannel: (id)=>request(`/client/channels/${id}`),
  createChannel: (payload)=>request("/client/channels", { method:"POST", body:payload }),
  getTrackingProfiles: ()=>request("/client/tracking-profiles"),
  createTrackingProfile: (payload)=>request("/client/tracking-profiles", { method:"POST", body:payload }),
  getLandingPages: ()=>request("/client/landing-pages"),
  getLandingPage: (id)=>request(`/client/landing-pages/${id}`),
  getLandingPageEvents: (id, limit=50)=>request(`/client/landing-pages/${id}/events?limit=${limit}`),
  createLandingPage: (payload)=>request("/client/landing-pages", { method:"POST", body:payload }),
  getLogs: (limit=80)=>request(`/client/logs?limit=${limit}`),

  ownerGetClients: ()=>request("/owner/clients"),
  ownerGetApprovals: ()=>request("/owner/approvals"),
  ownerApproveClient: (id)=>request(`/owner/clients/${id}/approve`, { method:"POST" }),
  ownerRejectClient: (id)=>request(`/owner/clients/${id}/reject`, { method:"POST" }),
}

export async function downloadExportZip(lpId){
  const a = getAuth()
  const res = await fetch(API_BASE + `/deploy/export/${lpId}`, {
    headers: a?.access_token ? { Authorization: `Bearer ${a.access_token}` } : {}
  })
  if(!res.ok) throw new Error(`Export failed (${res.status})`)
  const blob = await res.blob()
  const cd = res.headers.get("content-disposition") || ""
  const m = /filename="([^"]+)"/.exec(cd)
  const filename = m?.[1] || "landing-page.zip"

  const url = URL.createObjectURL(blob)
  const aTag = document.createElement("a")
  aTag.href = url
  aTag.download = filename
  document.body.appendChild(aTag)
  aTag.click()
  aTag.remove()
  URL.revokeObjectURL(url)
}
