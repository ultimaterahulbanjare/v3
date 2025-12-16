import express from "express"
import { query } from "../db/pool.js"
import { approveJoinRequest } from "../services/telegram.service.js"
import { sendMetaCapi } from "../services/capi.service.js"

const router = express.Router()

// Telegram will POST updates here
// Set webhook to: https://<your-render-domain>/telegram/webhook
router.post("/telegram/webhook", async (req,res)=>{
  // Optional: verify secret token header
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET
  if(expected){
    const got = req.header("X-Telegram-Bot-Api-Secret-Token")
    if(got !== expected){
      return res.status(401).json({ ok:false, error:"invalid_secret" })
    }
  }

  const update = req.body || {}

  try{
    if(!update.chat_join_request){
      return res.json({ ok:true, ignored:true })
    }

    const jr = update.chat_join_request
    const chatId = String(jr.chat?.id || "")
    const userId = String(jr.from?.id || "")
    const inviteLink = jr.invite_link?.invite_link || null
    const inviteName = jr.invite_link?.name || null

    if(!chatId || !userId){
      return res.json({ ok:true, ignored:true })
    }

    // Find channel by telegram_chat_id
    const chRes = await query("SELECT * FROM channels WHERE telegram_chat_id=$1 LIMIT 1", [chatId])
    if(chRes.rows.length === 0){
      // Channel not registered yet
      return res.json({ ok:true, ignored:true, reason:"channel_not_found" })
    }
    const channel = chRes.rows[0]

    // Determine landing page:
    // 1) invite link name matches LP slug
    // 2) else latest active LP for channel
    let lp = null
    if(inviteName){
      const lpBySlug = await query(
        "SELECT * FROM landing_pages WHERE client_id=$1 AND channel_id=$2 AND slug=$3 LIMIT 1",
        [channel.client_id, channel.id, inviteName]
      )
      if(lpBySlug.rows.length) lp = lpBySlug.rows[0]
    }
    if(!lp){
      const lpLatest = await query(
        "SELECT * FROM landing_pages WHERE client_id=$1 AND channel_id=$2 ORDER BY created_at DESC LIMIT 1",
        [channel.client_id, channel.id]
      )
      if(lpLatest.rows.length) lp = lpLatest.rows[0]
    }

    // Tracking profile (pixel + capi)
    let tp = null
    if(lp?.tracking_profile_id){
      const tpRes = await query(
        "SELECT * FROM tracking_profiles WHERE id=$1 AND client_id=$2 LIMIT 1",
        [lp.tracking_profile_id, channel.client_id]
      )
      if(tpRes.rows.length) tp = tpRes.rows[0]
    }

    // Auto approve join request (optional)
    let approved = false
    if(String(process.env.TELEGRAM_AUTO_APPROVE||"").toLowerCase() === "true"){
      const botToken = process.env.TELEGRAM_BOT_TOKEN
      if(botToken){
        try{
          await approveJoinRequest({ botToken, chatId, userId })
          approved = true
        }catch(e){
          // don't fail whole flow
        }
      }
    }

    // Write join record
    const joinIns = await query(
      `INSERT INTO joins(client_id,channel_id,landing_page_id,tracking_profile_id,telegram_chat_id,telegram_user_id,invite_link,invite_name,capi_status)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, ts`,
      [
        channel.client_id,
        channel.id,
        lp?.id || null,
        tp?.id || null,
        chatId,
        userId,
        inviteLink,
        inviteName,
        approved ? "APPROVED" : "PENDING"
      ]
    )
    const joinRow = joinIns.rows[0]

    // Also log event in events table (for analytics)
    await query(
      `INSERT INTO events(client_id,channel_id,landing_page_id,tracking_profile_id,type,status,session_id,user_agent,ip)
       VALUES($1,$2,$3,$4,'join',$5,$6,$7,$8)`,
      [
        channel.client_id,
        channel.id,
        lp?.id || null,
        tp?.id || null,
        approved ? "APPROVED" : "RECEIVED",
        `tg:${userId}`,
        req.headers["user-agent"] || null,
        req.ip || null
      ]
    )

    // Fire Meta CAPI (optional & requires token)
    const shouldCapi = String(process.env.CAPI_ENABLED||"true").toLowerCase() === "true"
    let capiResult = { ok:false, skipped:true, reason:"disabled" }

    if(shouldCapi && tp?.pixel_id && tp?.capi_token_enc){
      const eventName = process.env.CAPI_EVENT_NAME || "Subscribe"
      const testCode = process.env.META_TEST_EVENT_CODE || null
      capiResult = await sendMetaCapi({
        pixelId: tp.pixel_id,
        accessToken: tp.capi_token_enc,
        eventName,
        eventSourceUrl: process.env.CAPI_EVENT_SOURCE_URL || (lp?.deploy_url || "https://example.com/"),
        eventId: `join_${joinRow.id}`,
        eventTime: Math.floor(new Date(joinRow.ts).getTime()/1000),
        externalId: `tg_${userId}`,
        clientIp: null,
        userAgent: req.headers["user-agent"] || null,
        testEventCode: testCode
      })
    }

    // Save capi result
    await query(
      "UPDATE joins SET capi_status=$2, capi_error=$3 WHERE id=$1",
      [joinRow.id, capiResult.ok ? "OK" : (capiResult.skipped ? "SKIPPED" : "FAIL"), capiResult.ok ? null : JSON.stringify(capiResult.error || capiResult.reason || "error")]
    )
    await query(
      `INSERT INTO events(client_id,channel_id,landing_page_id,tracking_profile_id,type,status,session_id)
       VALUES($1,$2,$3,$4,$5,$6,$7)`,
      [
        channel.client_id,
        channel.id,
        lp?.id || null,
        tp?.id || null,
        capiResult.ok ? "capi_ok" : (capiResult.skipped ? "capi_skip" : "capi_fail"),
        capiResult.ok ? "OK" : "ERR",
        `join:${joinRow.id}`
      ]
    )

    return res.json({ ok:true, approved, capi: capiResult.ok ? "OK" : (capiResult.skipped ? "SKIPPED" : "FAIL") })
  }catch(err){
    return res.status(500).json({ ok:false, error: err?.message || "internal_error" })
  }
})

export default router
