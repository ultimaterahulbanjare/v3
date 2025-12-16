import express from "express"
import { z } from "zod"
import { query } from "../db/pool.js"

const router = express.Router()

router.post("/t/e", async (req,res)=>{
  const schema = z.object({
    client_id: z.string().uuid(),
    landing_page_id: z.string().uuid().optional(),
    channel_id: z.string().uuid().optional(),
    tracking_profile_id: z.string().uuid().optional(),
    type: z.string().min(1),
    session_id: z.string().optional(),
    country: z.string().optional(),
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    status: z.string().optional()
  })
  const parsed = schema.safeParse(req.body)
  if(!parsed.success) return res.status(400).json({ error:"Invalid payload" })
  const b = parsed.data

  await query(
    `INSERT INTO events(client_id,channel_id,landing_page_id,tracking_profile_id,type,session_id,country,utm_source,utm_medium,utm_campaign,status,user_agent,ip)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      b.client_id,
      b.channel_id || null,
      b.landing_page_id || null,
      b.tracking_profile_id || null,
      b.type,
      b.session_id || null,
      b.country || null,
      b.utm_source || null,
      b.utm_medium || null,
      b.utm_campaign || null,
      b.status || null,
      req.headers["user-agent"] || null,
      req.ip || null
    ]
  )
  return res.json({ ok:true })
})

router.post("/t/prelead", async (req,res)=>{
  const schema = z.object({
    client_id: z.string().uuid(),
    landing_page_id: z.string().uuid(),
    channel_id: z.string().uuid(),
    tracking_profile_id: z.string().uuid(),
    session_id: z.string().min(6),
    utm_source: z.string().optional(),
    status: z.string().optional()
  })
  const parsed = schema.safeParse(req.body)
  if(!parsed.success) return res.status(400).json({ error:"Invalid payload" })
  const b = parsed.data

  await query(
    `INSERT INTO events(client_id,channel_id,landing_page_id,tracking_profile_id,type,session_id,utm_source,status,user_agent,ip)
     VALUES($1,$2,$3,$4,'pre_lead',$5,$6,$7,$8,$9)`,
    [
      b.client_id,
      b.channel_id,
      b.landing_page_id,
      b.tracking_profile_id,
      b.session_id,
      b.utm_source || null,
      b.status || "OK",
      req.headers["user-agent"] || null,
      req.ip || null
    ]
  )
  return res.json({ ok:true })
})

export default router
