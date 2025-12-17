import express from "express"
import bcrypt from "bcrypt"
import { z } from "zod"
import { query } from "../db/pool.js"
import { signAccessToken } from "../middleware/auth.js"

const router = express.Router()

router.post("/register", async (req,res)=>{
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    plan: z.enum(["Single","Starter","Pro","Agency"]).default("Pro")
  })
  const body = schema.safeParse(req.body)
  if(!body.success) return res.status(400).json({ error:"Invalid payload" })
  const b = body.data

  const planConfig = {
    Single: { max_channels:1, max_landing_pages:5, max_tracking_profiles:1, amount_inr:1999 },
    Starter:{ max_channels:3, max_landing_pages:15, max_tracking_profiles:3, amount_inr:4999 },
    Pro:    { max_channels:5, max_landing_pages:30, max_tracking_profiles:5, amount_inr:8999 },
    Agency: { max_channels:10, max_landing_pages:80, max_tracking_profiles:10, amount_inr:19999 }
  }[b.plan]

  const upiId = process.env.OWNER_UPI_ID || "yourupi@bank"
  const upiName = process.env.OWNER_UPI_NAME || "UTS"

  const passHash = await bcrypt.hash(b.password, 10)

  // create user + client + link, status PAST_DUE until owner approves payment
  const userRes = await query(
    "INSERT INTO users(email,password_hash,role,is_active) VALUES($1,$2,'client',true) RETURNING id,email,role",
    [b.email.toLowerCase(), passHash]
  ).catch(err=>{
    if(String(err).includes("users_email_key")) return null
    throw err
  })

  if(!userRes) return res.status(409).json({ error:"Email already exists" })
  const user = userRes.rows[0]

  const clientRes = await query(
    `INSERT INTO clients(name, plan, max_channels, max_landing_pages, max_tracking_profiles, status, subscription_end, purge_after, is_active)
     VALUES($1,$2,$3,$4,$5,'PAST_DUE', NULL, NULL, true)
     RETURNING *`,
    [b.name, b.plan, planConfig.max_channels, planConfig.max_landing_pages, planConfig.max_tracking_profiles]
  )
  const client = clientRes.rows[0]

  await query("INSERT INTO client_users(client_id,user_id) VALUES($1,$2)", [client.id, user.id])

  const payRes = await query(
    `INSERT INTO payments(client_id, plan, amount_inr, upi_id, upi_name, status)
     VALUES($1,$2,$3,$4,$5,'PENDING')
     RETURNING id, amount_inr, upi_id, upi_name, status, created_at`,
    [client.id, b.plan, planConfig.amount_inr, upiId, upiName]
  )

  const token = signAccessToken({ user_id: user.id, role: user.role })

  return res.json({
    ok:true,
    access_token: token,
    role: user.role,
    user: { id:user.id, email:user.email, role:user.role, name:b.name, plan:b.plan },
    billing: payRes.rows[0]
  })
})

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
