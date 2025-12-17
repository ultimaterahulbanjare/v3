import React, { useEffect, useState } from "react"
import Topbar from "../../components/Topbar.jsx"
import { request } from "../../lib/api.js"

export default function LpGenerator(){
  const [prompt, setPrompt] = useState("Write a high converting landing page for my Telegram channel. Include a hero, 3-5 benefits, social proof, and a single CTA to join.")
  const [language, setLanguage] = useState("en")
  const [channels, setChannels] = useState([])
  const [profiles, setProfiles] = useState([])
  const [channelId, setChannelId] = useState("")
  const [profileId, setProfileId] = useState("")
  const [generated, setGenerated] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")
  const [msg, setMsg] = useState("")

  async function load(){
    const ch = await request("/client/channels")
    const tp = await request("/client/tracking-profiles")
    setChannels(ch.channels || [])
    setProfiles(tp.tracking_profiles || [])
    if((ch.channels||[]).length && !channelId) setChannelId(ch.channels[0].id)
    if((tp.tracking_profiles||[]).length && !profileId) setProfileId(tp.tracking_profiles[0].id)
  }

  useEffect(()=>{ load().catch(e=>setErr(e.message||"Failed")) }, [])

  async function generate(){
    setBusy(true); setErr(""); setMsg("")
    try{
      const res = await request("/client/ai/generate-lp", {
        method:"POST",
        body:{ prompt, channel_id: channelId, tracking_profile_id: profileId, language }
      })
      setGenerated(res.generated)
      setMsg("Generated! Review and save as a Landing Page.")
    }catch(e){
      setErr(e.message||"Failed")
    }finally{
      setBusy(false)
    }
  }

  async function save(){
    if(!generated) return
    setBusy(true); setErr(""); setMsg("")
    try{
      const res = await request("/client/ai/create-lp", {
        method:"POST",
        body:{
          name: generated.name || "AI Landing Page",
          slug: generated.slug || "ai-lp",
          html: generated.html || "",
          channel_id: channelId,
          tracking_profile_id: profileId
        }
      })
      setMsg("Saved! Open Landing Pages to view analytics & deploy.")
      setGenerated(null)
    }catch(e){
      setErr(e.message||"Failed")
    }finally{
      setBusy(false)
    }
  }

  return (
    <div>
      <Topbar title="AI LP Generator" subtitle="Generate a fresh landing page design with OpenAI, then save it as an LP." />

      <div className="card">
        {err ? <div className="authErr">{err}</div> : null}
        {msg ? <div className="authOk">{msg}</div> : null}

        <div className="grid2">
          <div>
            <div className="label">Channel</div>
            <select value={channelId} onChange={e=>setChannelId(e.target.value)}>
              {channels.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <div className="label">Tracking profile</div>
            <select value={profileId} onChange={e=>setProfileId(e.target.value)}>
              {profiles.map(p=><option key={p.id} value={p.id}>{p.name} • Pixel {p.pixel_id}</option>)}
            </select>
          </div>
        </div>

        <div style={{marginTop:10}}>
          <div className="label">Language</div>
          <select value={language} onChange={e=>setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>

        <div style={{marginTop:10}}>
          <div className="label">Prompt</div>
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={7} />
        </div>

        <button className="btnPrimary" onClick={generate} disabled={busy || !channelId || !profileId} style={{marginTop:12}}>
          {busy ? "Generating..." : "Generate"}
        </button>

        {generated ? (
          <div style={{marginTop:14}}>
            <div className="h2">Preview</div>
            <div className="hint">This is raw HTML. You can deploy/export after saving.</div>
            <div className="codeBox">
              <pre style={{whiteSpace:"pre-wrap"}}>{generated.html?.slice(0, 6000) || ""}</pre>
            </div>
            <button className="btnPrimary" onClick={save} disabled={busy} style={{marginTop:10}}>
              {busy ? "Saving..." : "Save as Landing Page"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
