import fs from "fs"
import path from "path"
import bcrypt from "bcrypt"
import { fileURLToPath } from "url"
import { query } from "./pool.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function migrate(){
  const schemaPath = path.join(__dirname, "schema.sql")
  const sql = fs.readFileSync(schemaPath, "utf-8")
  await query(sql)

  if(String(process.env.SEED_ON_MIGRATE||"").toLowerCase() === "true"){
    await seedIfEmpty()
  }
}

async function seedIfEmpty(){
  const { rows } = await query("SELECT COUNT(*)::int as n FROM users")
  if(rows[0].n > 0) return

  const ownerEmail = process.env.DEMO_OWNER_EMAIL || "owner@admin.com"
  const ownerPass = process.env.DEMO_OWNER_PASSWORD || "admin123"
  const clientEmail = process.env.DEMO_CLIENT_EMAIL || "demo@client.com"
  const clientPass = process.env.DEMO_CLIENT_PASSWORD || "demo123"
  const clientName = process.env.DEMO_CLIENT_NAME || "Demo Client"

  const ownerHash = await bcrypt.hash(ownerPass, 10)
  const clientHash = await bcrypt.hash(clientPass, 10)

  const owner = await query(
    "INSERT INTO users(email,password_hash,role) VALUES($1,$2,'owner') RETURNING id,email,role",
    [ownerEmail, ownerHash]
  )
  const clientUser = await query(
    "INSERT INTO users(email,password_hash,role) VALUES($1,$2,'client') RETURNING id,email,role",
    [clientEmail, clientHash]
  )

  const cl = await query(
    "INSERT INTO clients(name, owner_user_id, plan, max_channels, max_landing_pages, max_tracking_profiles, status) VALUES($1,$2,'Pro',5,20,5,'ACTIVE') RETURNING id",
    [clientName, owner.rows[0].id]
  )

  await query("INSERT INTO client_users(client_id,user_id) VALUES($1,$2)", [cl.rows[0].id, clientUser.rows[0].id])

  // tracking profile (Pixel + CAPI bundle)
  const tp = await query(
    "INSERT INTO tracking_profiles(client_id,name,pixel_id,capi_token_enc,status) VALUES($1,$2,$3,$4,'ACTIVE') RETURNING id",
    [cl.rows[0].id, "Demo Profile", "000000000000000", "demo-token-enc"]
  )

  // channel
  const ch = await query(
    "INSERT INTO channels(client_id,name,telegram_chat_id,status,bot_mode) VALUES($1,$2,$3,'ACTIVE','universal') RETURNING id",
    [cl.rows[0].id, "Demo Channel", "-1001234567890"]
  )

  // landing page
  const lp = await query(
    "INSERT INTO landing_pages(client_id,channel_id,tracking_profile_id,name,slug,template_key,status,anti_crawler,deploy_provider,deploy_status) VALUES($1,$2,$3,$4,$5,$6,'active',false,'manual','READY') RETURNING id",
    [cl.rows[0].id, ch.rows[0].id, tp.rows[0].id, "Demo LP", "demo-lp", "neon-card"]
  )

  // seed some events
  await query(
    "INSERT INTO events(client_id,channel_id,landing_page_id,tracking_profile_id,type,status) VALUES($1,$2,$3,$4,'pageview','OK'),($1,$2,$3,$4,'pre_lead','OK'),($1,$2,$3,$4,'join','OK')",
    [cl.rows[0].id, ch.rows[0].id, lp.rows[0].id, tp.rows[0].id]
  )
}
