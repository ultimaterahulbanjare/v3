import express from "express"
import { requireAuth, requireRole } from "../middleware/auth.js"
import { query } from "../db/pool.js"

const router = express.Router()
router.use(requireAuth, requireRole("owner"))

router.get("/clients", async (req,res)=>{
  const { rows } = await query(
    "SELECT id,name,plan,status,max_channels,max_landing_pages,max_tracking_profiles,created_at,subscription_end,purge_after FROM clients ORDER BY created_at DESC"
  )
  return res.json({ clients: rows })
})

router.get("/approvals", async (req,res)=>{
  // In this starter: approvals = clients with status PAST_DUE or EXPIRED
  const { rows } = await query(
    "SELECT id,name,plan,status,subscription_end FROM clients WHERE status IN ('PAST_DUE','EXPIRED') ORDER BY created_at DESC"
  )
  return res.json({ approvals: rows })
})

router.post("/clients/:id/approve", async (req,res)=>{
  const id = req.params.id
  const subEnd = new Date(Date.now() + 30*24*3600*1000) // +30d
  const purgeAfter = new Date(subEnd.getTime() + 90*24*3600*1000)
  const { rows } = await query(
    "UPDATE clients SET status='ACTIVE', subscription_end=$2, purge_after=$3 WHERE id=$1 RETURNING *",
    [id, subEnd.toISOString(), purgeAfter.toISOString()]
  )
  if(rows.length===0) return res.status(404).json({ error:"Not found" })
  return res.json({ client: rows[0] })
})

router.post("/clients/:id/reject", async (req,res)=>{
  const id = req.params.id
  const { rows } = await query(
    "UPDATE clients SET status='EXPIRED' WHERE id=$1 RETURNING *",
    [id]
  )
  if(rows.length===0) return res.status(404).json({ error:"Not found" })
  return res.json({ client: rows[0] })
})

/** ===== Payments (UPI manual) ===== **/
router.get("/payments", async (req,res)=>{
  const { rows } = await query(
    `SELECT p.*, c.name as client_name, c.status as client_status
     FROM payments p
     JOIN clients c ON c.id=p.client_id
     ORDER BY p.created_at DESC
     LIMIT 200`
  )
  return res.json({ payments: rows })
})

router.post("/payments/:id/approve", async (req,res)=>{
  const payId = req.params.id
  const schema = z.object({
    months: z.number().int().min(1).max(24).default(1),
    enable_dedicated_bot: z.boolean().default(true),
    note: z.string().max(500).optional()
  })
  const body = schema.safeParse(req.body||{})
  if(!body.success) return res.status(400).json({ error:"Invalid payload" })
  const b = body.data

  const pRes = await query("SELECT * FROM payments WHERE id=$1 LIMIT 1", [payId])
  if(pRes.rows.length===0) return res.status(404).json({ error:"Payment not found" })
  const p = pRes.rows[0]

  await query("UPDATE payments SET status='APPROVED', decided_at=now(), note=COALESCE($2,note) WHERE id=$1", [payId, b.note || null])

  // activate client subscription
  await query(
    `UPDATE clients
     SET status='ACTIVE',
         subscription_end = now() + ($2 || ' months')::interval,
         purge_after = NULL
     WHERE id=$1`,
    [p.client_id, String(b.months)]
  )

  // ensure dedicated bot flag stored (simple: create a row in events; UI reads payments)
  if(b.enable_dedicated_bot){
    await query(
      "INSERT INTO events(client_id,type,status) VALUES($1,'dedicated_bot_enabled','OK')",
      [p.client_id]
    )
  }

  return res.json({ ok:true })
})

router.post("/payments/:id/reject", async (req,res)=>{
  const payId = req.params.id
  const schema = z.object({ note: z.string().max(500).optional() })
  const body = schema.safeParse(req.body||{})
  if(!body.success) return res.status(400).json({ error:"Invalid payload" })

  await query("UPDATE payments SET status='REJECTED', decided_at=now(), note=COALESCE($2,note) WHERE id=$1", [payId, body.data.note || null])
  return res.json({ ok:true })
})

export default router
