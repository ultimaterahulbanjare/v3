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

export default router
