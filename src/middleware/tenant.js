import { query } from "../db/pool.js"

async function autoExpireAndPurge(client){
  // If subscription_end passed, move ACTIVE -> EXPIRED and set purge_after (90 days)
  if(client.status === "ACTIVE" && client.subscription_end){
    const { rows } = await query("SELECT now() as now")
    const now = rows[0].now
    if(new Date(now) > new Date(client.subscription_end)){
      await query(
        "UPDATE clients SET status='EXPIRED', purge_after = COALESCE(purge_after, now() + interval '90 days') WHERE id=$1",
        [client.id]
      )
      client.status = "EXPIRED"
    }
  }

  if(client.status === "EXPIRED" && client.purge_after){
    const { rows } = await query("SELECT now() as now")
    const now = rows[0].now
    if(new Date(now) > new Date(client.purge_after)){
      // purge tenant data
      await query("DELETE FROM events WHERE client_id=$1", [client.id])
      await query("DELETE FROM joins WHERE client_id=$1", [client.id])
      await query("DELETE FROM lp_versions WHERE landing_page_id IN (SELECT id FROM landing_pages WHERE client_id=$1)", [client.id])
      await query("DELETE FROM landing_pages WHERE client_id=$1", [client.id])
      await query("DELETE FROM tracking_profiles WHERE client_id=$1", [client.id])
      await query("DELETE FROM bot_channel_map WHERE bot_id IN (SELECT id FROM telegram_bots WHERE client_id=$1)", [client.id])
      await query("DELETE FROM telegram_bots WHERE client_id=$1", [client.id])
      await query("DELETE FROM channels WHERE client_id=$1", [client.id])
      await query("UPDATE clients SET status='PURGED', is_active=false WHERE id=$1", [client.id])
      client.status = "PURGED"
      client.is_active = false
    }
  }
}

export async function attachClient(req, res, next){
  if(req.user?.role === "owner"){
    return next()
  }
  const userId = req.user?.user_id
  if(!userId) return res.status(401).json({ error:"Unauthorized" })

  const { rows } = await query(
    "SELECT c.* FROM clients c JOIN client_users cu ON cu.client_id=c.id WHERE cu.user_id=$1 AND c.is_active=true LIMIT 1",
    [userId]
  )
  if(rows.length === 0) return res.status(403).json({ error:"Client not linked" })

  req.client = rows[0]
  await autoExpireAndPurge(req.client)

  return next()
}

export function enforceActiveSubscription(req, res, next){
  if(req.user?.role === "owner") return next()
  if(!req.client) return res.status(500).json({ error:"Client missing" })
  if(req.client.status !== "ACTIVE") return res.status(402).json({ error:"Subscription not active", status:req.client.status })
  return next()
}
