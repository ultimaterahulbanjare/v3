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

export default router
