import express from "express"
import { requireAuth } from "../middleware/auth.js"
import { attachClient } from "../middleware/tenant.js"
import { query } from "../db/pool.js"

const router = express.Router()

router.get("/me", requireAuth, attachClient, async (req,res)=>{
  const { rows } = await query("SELECT id,email,role FROM users WHERE id=$1", [req.user.user_id])
  const user = rows[0]
  return res.json({
    user,
    client: req.user.role === "client" ? {
      id: req.client.id,
      name: req.client.name,
      plan: req.client.plan,
      status: req.client.status,
      max_channels: req.client.max_channels,
      max_landing_pages: req.client.max_landing_pages,
      max_tracking_profiles: req.client.max_tracking_profiles
    } : null
  })
})

export default router
