import express from "express"
import bcrypt from "bcrypt"
import { z } from "zod"
import { query } from "../db/pool.js"
import { signAccessToken } from "../middleware/auth.js"

const router = express.Router()

router.post("/login", async (req,res)=>{
  const schema = z.object({ email:z.string().email(), password:z.string().min(1) })
  const body = schema.safeParse(req.body)
  if(!body.success) return res.status(400).json({ error:"Invalid payload" })

  const { rows } = await query("SELECT id,email,password_hash,role,is_active FROM users WHERE email=$1 LIMIT 1", [body.data.email])
  if(rows.length===0) return res.status(401).json({ error:"Invalid credentials" })
  const u = rows[0]
  if(!u.is_active) return res.status(403).json({ error:"User inactive" })
  if(u.role !== "client") return res.status(403).json({ error:"Use /auth/owner/login for owner" })

  const ok = await bcrypt.compare(body.data.password, u.password_hash)
  if(!ok) return res.status(401).json({ error:"Invalid credentials" })

  const token = signAccessToken({ user_id:u.id, role:u.role })
  return res.json({ access_token: token, role:u.role })
})

router.post("/owner/login", async (req,res)=>{
  const schema = z.object({ email:z.string().email(), password:z.string().min(1) })
  const body = schema.safeParse(req.body)
  if(!body.success) return res.status(400).json({ error:"Invalid payload" })

  const { rows } = await query("SELECT id,email,password_hash,role,is_active FROM users WHERE email=$1 LIMIT 1", [body.data.email])
  if(rows.length===0) return res.status(401).json({ error:"Invalid credentials" })
  const u = rows[0]
  if(!u.is_active) return res.status(403).json({ error:"User inactive" })
  if(u.role !== "owner") return res.status(403).json({ error:"Not owner" })

  const ok = await bcrypt.compare(body.data.password, u.password_hash)
  if(!ok) return res.status(401).json({ error:"Invalid credentials" })

  const token = signAccessToken({ user_id:u.id, role:u.role })
  return res.json({ access_token: token, role:u.role })
})

export default router
