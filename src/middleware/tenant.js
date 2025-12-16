import { query } from "../db/pool.js"

export async function attachClient(req, res, next){
  // owner can query cross-tenant; client must have client_id
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
  return next()
}

export function enforceActiveSubscription(req, res, next){
  if(req.user?.role === "owner") return next()
  if(!req.client) return res.status(500).json({ error:"Client missing" })
  if(req.client.status !== "ACTIVE") return res.status(402).json({ error:"Subscription not active", status:req.client.status })
  return next()
}
