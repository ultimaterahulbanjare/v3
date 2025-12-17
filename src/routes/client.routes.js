import express from "express"
import { requireAuth, requireRole } from "../middleware/auth.js"
import { attachClient, enforceActiveSubscription } from "../middleware/tenant.js"
import { query } from "../db/pool.js"
import { z } from "zod"

const router = express.Router()

router.use(requireAuth, requireRole("client"), attachClient)

router.get("/channels", async (req,res)=>{
  const { rows } = await query("SELECT * FROM channels WHERE client_id=$1 ORDER BY created_at DESC", [req.client.id])
  return res.json({ channels: rows })
})

router.get("/channels/:id", async (req,res)=>{
  const channelId = req.params.id
  const ch = await query("SELECT * FROM channels WHERE id=$1 AND client_id=$2", [channelId, req.client.id])
  if(ch.rows.length===0) return res.status(404).json({ error:"Not found" })

  const lps = await query(
    `SELECT lp.*, tp.name as tracking_profile_name, tp.pixel_id
     FROM landing_pages lp
     JOIN tracking_profiles tp ON tp.id=lp.tracking_profile_id
     WHERE lp.client_id=$1 AND lp.channel_id=$2
     ORDER BY lp.created_at DESC`,
    [req.client.id, channelId]
  )

  // quick metrics per LP
  const lpIds = lps.rows.map(r=>r.id)
  let metrics = {}
  if(lpIds.length){
    const m = await query(
      `SELECT landing_page_id,
        COUNT(*) FILTER (WHERE type='pageview') as visitors,
        COUNT(*) FILTER (WHERE type='pre_lead') as preleads,
        COUNT(*) FILTER (WHERE type='join') as joins
       FROM events
       WHERE client_id=$1 AND landing_page_id = ANY($2::uuid[])
       GROUP BY landing_page_id`,
      [req.client.id, lpIds]
    )
    metrics = { }
    for(const r of m.rows) metrics[r.landing_page_id] = r
  }
  return res.json({ channel: ch.rows[0], landing_pages: lps.rows.map(r=>({ ...r, metrics: metrics[r.id] || {visitors:0, preleads:0, joins:0} })) })
})

router.post("/channels", enforceActiveSubscription, async (req,res)=>{
  const schema = z.object({
    name: z.string().min(2),
    telegram_chat_id: z.string().min(5)
  })
  const body = schema.safeParse(req.body)
  if(!body.success) return res.status(400).json({ error:"Invalid payload" })

  // enforce plan limit
  const c = await query("SELECT COUNT(*)::int as n FROM channels WHERE client_id=$1", [req.client.id])
  if(c.rows[0].n >= req.client.max_channels) return res.status(403).json({ error:"Plan limit reached (channels)" })

  const { rows } = await query(
    "INSERT INTO channels(client_id,name,telegram_chat_id,status,bot_mode) VALUES($1,$2,$3,'ACTIVE','universal') RETURNING *",
    [req.client.id, body.data.name, body.data.telegram_chat_id]
  )
  return res.json({ channel: rows[0] })
})

router.get("/tracking-profiles", async (req,res)=>{
  const { rows } = await query(
    "SELECT id,client_id,name,pixel_id,status,created_at,updated_at FROM tracking_profiles WHERE client_id=$1 ORDER BY created_at DESC",
    [req.client.id]
  )
  return res.json({ tracking_profiles: rows })
})

router.post("/tracking-profiles", enforceActiveSubscription, async (req,res)=>{
  const schema = z.object({
    name: z.string().min(2),
    pixel_id: z.string().min(5),
    capi_token: z.string().min(5)
  })
  const body = schema.safeParse(req.body)
  if(!body.success) return res.status(400).json({ error:"Invalid payload" })

  const c = await query("SELECT COUNT(*)::int as n FROM tracking_profiles WHERE client_id=$1", [req.client.id])
  if(c.rows[0].n >= req.client.max_tracking_profiles) return res.status(403).json({ error:"Plan limit reached (tracking profiles)" })

  // Store token as capi_token_enc for now (you can encrypt later)
  const { rows } = await query(
    "INSERT INTO tracking_profiles(client_id,name,pixel_id,capi_token_enc,status) VALUES($1,$2,$3,$4,'ACTIVE') RETURNING id,client_id,name,pixel_id,status,created_at,updated_at",
    [req.client.id, body.data.name, body.data.pixel_id, body.data.capi_token]
  )
  return res.json({ tracking_profile: rows[0] })
})

router.get("/landing-pages", async (req,res)=>{
  const { rows } = await query(
    `SELECT lp.*, c.name as channel_name, tp.name as tracking_profile_name, tp.pixel_id
     FROM landing_pages lp
     JOIN channels c ON c.id=lp.channel_id
     JOIN tracking_profiles tp ON tp.id=lp.tracking_profile_id
     WHERE lp.client_id=$1
     ORDER BY lp.created_at DESC`,
    [req.client.id]
  )
  // attach metrics
  const lpIds = rows.map(r=>r.id)
  let metrics = {}
  if(lpIds.length){
    const m = await query(
      `SELECT landing_page_id,
        COUNT(*) FILTER (WHERE type='pageview') as visitors,
        COUNT(*) FILTER (WHERE type='pre_lead') as preleads,
        COUNT(*) FILTER (WHERE type='join') as joins
       FROM events
       WHERE client_id=$1 AND landing_page_id = ANY($2::uuid[])
       GROUP BY landing_page_id`,
      [req.client.id, lpIds]
    )
    for(const r of m.rows) metrics[r.landing_page_id] = r
  }
  return res.json({ landing_pages: rows.map(r=>({ ...r, metrics: metrics[r.id] || {visitors:0, preleads:0, joins:0} })) })
})

router.get("/landing-pages/:id", async (req,res)=>{
  const lpId = req.params.id
  const { rows } = await query(
    `SELECT lp.*, c.name as channel_name, c.telegram_chat_id, tp.name as tracking_profile_name, tp.pixel_id
     FROM landing_pages lp
     JOIN channels c ON c.id=lp.channel_id
     JOIN tracking_profiles tp ON tp.id=lp.tracking_profile_id
     WHERE lp.id=$1 AND lp.client_id=$2`,
    [lpId, req.client.id]
  )
  if(rows.length===0) return res.status(404).json({ error:"Not found" })
  const lp = rows[0]

  const m = await query(
    `SELECT
      COUNT(*) FILTER (WHERE type='pageview') as visitors,
      COUNT(*) FILTER (WHERE type='pre_lead') as preleads,
      COUNT(*) FILTER (WHERE type='join') as joins
     FROM events
     WHERE client_id=$1 AND landing_page_id=$2`,
    [req.client.id, lpId]
  )

  return res.json({ landing_page: lp, metrics: m.rows[0] })
})

router.get("/landing-pages/:id/events", async (req,res)=>{
  const lpId = req.params.id
  const limit = Math.min(200, Number(req.query.limit || 50))
  const { rows } = await query(
    `SELECT id, type, ts, session_id, country, utm_source, status
     FROM events
     WHERE client_id=$1 AND landing_page_id=$2
     ORDER BY ts DESC
     LIMIT $3`,
    [req.client.id, lpId, limit]
  )
  return res.json({ events: rows })
})

router.get("/logs", async (req,res)=>{
  const limit = Math.min(200, Number(req.query.limit || 80))
  const { rows } = await query(
    `SELECT id, type, ts, session_id, landing_page_id, channel_id, utm_source, status
     FROM events
     WHERE client_id=$1
     ORDER BY ts DESC
     LIMIT $2`,
    [req.client.id, limit]
  )
  return res.json({ events: rows })
})

/** ===== Billing (UPI manual) ===== **/
router.get("/billing/status", async (req,res)=>{
  const { rows } = await query(
    "SELECT id, plan, amount_inr, upi_id, upi_name, screenshot_url, txn_ref, status, created_at, decided_at, note FROM payments WHERE client_id=$1 ORDER BY created_at DESC LIMIT 1",
    [req.client.id]
  )
  const latest = rows[0] || null
  return res.json({
    client_status: req.client.status,
    subscription_end: req.client.subscription_end,
    purge_after: req.client.purge_after,
    latest_payment: latest
  })
})

router.post("/billing/submit-payment", async (req,res)=>{
  const schema = z.object({
    txn_ref: z.string().min(3).max(200),
    screenshot_url: z.string().url().optional()
  })
  const body = schema.safeParse(req.body)
  if(!body.success) return res.status(400).json({ error:"Invalid payload" })
  const b = body.data

  // attach to latest pending payment or create new one
  const p = await query(
    "SELECT * FROM payments WHERE client_id=$1 AND status='PENDING' ORDER BY created_at DESC LIMIT 1",
    [req.client.id]
  )
  if(p.rows.length===0){
    return res.status(400).json({ error:"No pending payment request" })
  }
  const pay = p.rows[0]
  const { rows } = await query(
    "UPDATE payments SET txn_ref=$1, screenshot_url=COALESCE($2,screenshot_url) WHERE id=$3 RETURNING id,status,txn_ref,screenshot_url",
    [b.txn_ref, b.screenshot_url || null, pay.id]
  )
  return res.json({ ok:true, payment: rows[0] })
})

/** ===== AI LP Generator (Phase B) ===== **/
router.post("/ai/generate-lp", enforceActiveSubscription, async (req,res)=>{
  const schema = z.object({
    prompt: z.string().min(10).max(4000),
    channel_id: z.string().uuid(),
    tracking_profile_id: z.string().uuid(),
    slug_hint: z.string().min(2).max(60).optional(),
    language: z.enum(["en","hi"]).default("en")
  })
  const body = schema.safeParse(req.body)
  if(!body.success) return res.status(400).json({ error:"Invalid payload" })
  const b = body.data

  if(!process.env.OPENAI_API_KEY){
    return res.status(400).json({ error:"Missing OPENAI_API_KEY" })
  }

  const model = process.env.OPENAI_MODEL || "gpt-5"
  const instructions = "You generate high-converting landing page HTML for a Telegram channel. Output STRICT JSON only."
  const input = {
    task: "Generate a responsive landing page HTML (single file) with a CTA button, short feature bullets, and compliance-friendly wording.",
    language: b.language,
    slug_hint: b.slug_hint || null,
    prompt: b.prompt,
    output_schema: {
      name: "string",
      slug: "string",
      html: "string"
    }
  }

  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type":"application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      instructions,
      input: JSON.stringify(input)
    })
  })

  if(!r.ok){
    const t = await r.text()
    return res.status(500).json({ error:"OpenAI error", detail: t })
  }
  const data = await r.json()

  // try to pull text output
  let text = ""
  try{
    text = data.output?.[0]?.content?.[0]?.text || data.output_text || ""
  }catch(e){}

  let out = null
  try{
    out = JSON.parse(text)
  }catch(e){
    // fallback: wrap raw
    out = { name: "AI Landing Page", slug: (b.slug_hint || "ai-lp").toLowerCase().replace(/[^a-z0-9-]/g,"-"), html: text }
  }

  // store generation
  await query(
    "INSERT INTO ai_generations(client_id,prompt,model,output_json) VALUES($1,$2,$3,$4)",
    [req.client.id, b.prompt, model, out]
  )

  return res.json({ ok:true, generated: out })
})

router.post("/ai/create-lp", enforceActiveSubscription, async (req,res)=>{
  const schema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2).max(80),
    html: z.string().min(50),
    channel_id: z.string().uuid(),
    tracking_profile_id: z.string().uuid()
  })
  const body = schema.safeParse(req.body)
  if(!body.success) return res.status(400).json({ error:"Invalid payload" })
  const b = body.data

  // ensure channel belongs to client
  const ch = await query("SELECT id FROM channels WHERE id=$1 AND client_id=$2", [b.channel_id, req.client.id])
  if(ch.rows.length===0) return res.status(404).json({ error:"Channel not found" })

  const tp = await query("SELECT id FROM tracking_profiles WHERE id=$1 AND client_id=$2", [b.tracking_profile_id, req.client.id])
  if(tp.rows.length===0) return res.status(404).json({ error:"Tracking profile not found" })

  const lpRes = await query(
    `INSERT INTO landing_pages(client_id, channel_id, tracking_profile_id, name, slug, status)
     VALUES($1,$2,$3,$4,$5,'ACTIVE')
     RETURNING *`,
    [req.client.id, b.channel_id, b.tracking_profile_id, b.name, b.slug]
  )
  const lp = lpRes.rows[0]
  await query(
    "INSERT INTO lp_versions(landing_page_id, version, source, html) VALUES($1,1,'ai',$2)",
    [lp.id, b.html]
  )
  return res.json({ ok:true, landing_page: lp })
})

/** ===== Dedicated Bots (Phase C) ===== **/
router.get("/bots", enforceActiveSubscription, async (req,res)=>{
  const { rows } = await query(
    "SELECT id,type,name,is_active,created_at FROM telegram_bots WHERE (client_id=$1 OR type='UNIVERSAL') AND is_active=true ORDER BY type DESC, created_at DESC",
    [req.client.id]
  )
  return res.json({ bots: rows })
})

router.post("/bots", enforceActiveSubscription, async (req,res)=>{
  const schema = z.object({
    name: z.string().min(2).max(60),
    token: z.string().min(20)
  })
  const body = schema.safeParse(req.body)
  if(!body.success) return res.status(400).json({ error:"Invalid payload" })
  const b = body.data

  if(!process.env.MASTER_KEY){
    return res.status(400).json({ error:"Missing MASTER_KEY for encryption" })
  }
  const { encrypt } = await import("../utils/crypto.js")
  const enc = encrypt(b.token, process.env.MASTER_KEY)

  const { rows } = await query(
    "INSERT INTO telegram_bots(client_id,type,name,token_enc,is_active) VALUES($1,'DEDICATED',$2,$3,true) RETURNING id,type,name,is_active,created_at",
    [req.client.id, b.name, enc]
  )
  return res.json({ ok:true, bot: rows[0] })
})

router.post("/bots/:id/map-channel", enforceActiveSubscription, async (req,res)=>{
  const schema = z.object({ channel_id: z.string().uuid() })
  const body = schema.safeParse(req.body)
  if(!body.success) return res.status(400).json({ error:"Invalid payload" })
  const botId = req.params.id
  const channelId = body.data.channel_id

  const bot = await query("SELECT id FROM telegram_bots WHERE id=$1 AND client_id=$2 AND type='DEDICATED'", [botId, req.client.id])
  if(bot.rows.length===0) return res.status(404).json({ error:"Bot not found" })

  const ch = await query("SELECT id FROM channels WHERE id=$1 AND client_id=$2", [channelId, req.client.id])
  if(ch.rows.length===0) return res.status(404).json({ error:"Channel not found" })

  await query("INSERT INTO bot_channel_map(bot_id,channel_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [botId, channelId])
  return res.json({ ok:true })
})

export default router
