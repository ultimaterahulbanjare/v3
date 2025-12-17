import express from "express"
import { query } from "../db/pool.js"
import { approveJoinRequest } from "../services/telegram.service.js"
import { sendMetaCapi } from "../services/capi.service.js"
import { decrypt } from "../utils/crypto.js"

const router = express.Router()

async function resolveBotTokenForChat(chatId){
  // Dedicated bot mapped to this channel?
  if(!process.env.MASTER_KEY) return process.env.TELEGRAM_BOT_TOKEN

  const { rows } = await query(
    `SELECT tb.token_enc
     FROM channels c
     JOIN bot_channel_map bcm ON bcm.channel_id=c.id
     JOIN telegram_bots tb ON tb.id=bcm.bot_id
     WHERE c.telegram_channel_id=$1 AND tb.is_active=true
     ORDER BY tb.created_at DESC
     LIMIT 1`,
    [String(chatId)]
  )
  if(rows.length===0) return process.env.TELEGRAM_BOT_TOKEN
  try{
    return decrypt(rows[0].token_enc, process.env.MASTER_KEY)
  }catch(e){
    return process.env.TELEGRAM_BOT_TOKEN
  }
}

// Telegram will POST updates here
router.post("/telegram/webhook", async (req,res)=>{
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET
  if(expected){
    const got = req.headers["x-telegram-bot-api-secret-token"]
    if(got !== expected){
      return res.status(401).json({ ok:false })
    }
  }

  const upd = req.body
  try{
    const jr = upd?.chat_join_request
    if(!jr) return res.json({ ok:true })

    const chatId = jr.chat?.id
    const userId = jr.from?.id
    const invite = jr.invite_link?.invite_link || null
    const inviteName = jr.invite_link?.name || null

    // Find client/channel by telegram_channel_id
    const chRes = await query(
      "SELECT * FROM channels WHERE telegram_channel_id=$1 LIMIT 1",
      [String(chatId)]
    )
    if(chRes.rows.length===0){
      return res.json({ ok:true })
    }
    const channel = chRes.rows[0]

    // Determine landing page by invite_name = slug (basic mapping)
    let lp = null
    if(inviteName){
      const lpRes = await query(
        "SELECT * FROM landing_pages WHERE client_id=$1 AND slug=$2 LIMIT 1",
        [channel.client_id, inviteName]
      )
      lp = lpRes.rows[0] || null
    }

    // Pull tracking profile from LP or channel default (LP preferred)
    let tp = null
    if(lp){
      const tpRes = await query("SELECT * FROM tracking_profiles WHERE id=$1 AND client_id=$2", [lp.tracking_profile_id, channel.client_id])
      tp = tpRes.rows[0] || null
    }

    const botToken = await resolveBotTokenForChat(chatId)

    // Approve join request (optional)
    if(String(process.env.TELEGRAM_AUTO_APPROVE||"false").toLowerCase()==="true"){
      await approveJoinRequest({ botToken, chatId, userId })
    }

    // Store join row
    await query(
      `INSERT INTO joins(client_id, channel_id, landing_page_id, tracking_profile_id, telegram_chat_id, telegram_user_id, invite_link, invite_name, capi_status, capi_error)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        channel.client_id,
        channel.id,
        lp?.id || null,
        tp?.id || null,
        String(chatId),
        String(userId),
        invite,
        inviteName,
        null,
        null
      ]
    )

    // Fire Meta CAPI (optional)
    if(String(process.env.CAPI_ENABLED||"false").toLowerCase()==="true" && tp?.pixel_id && tp?.meta_access_token){
      const eventId = `join_${channel.client_id}_${chatId}_${userId}_${Date.now()}`
      const capi = await sendMetaCapi({
        pixelId: tp.pixel_id,
        accessToken: tp.meta_access_token,
        eventName: process.env.CAPI_EVENT_NAME || "Subscribe",
        eventSourceUrl: channel.telegram_invite_link || undefined,
        eventId,
        eventTime: Math.floor(Date.now()/1000),
        externalId: String(userId),
        clientIp: req.ip,
        userAgent: req.headers["user-agent"] || "",
        testEventCode: process.env.META_TEST_EVENT_CODE || undefined
      })
      await query(
        "UPDATE joins SET capi_status=$1, capi_error=$2 WHERE telegram_chat_id=$3 AND telegram_user_id=$4 ORDER BY ts DESC LIMIT 1",
        [capi.ok ? "capi_ok" : "capi_fail", capi.ok ? null : (capi.detail || capi.error || "capi_fail"), String(chatId), String(userId)]
      )
      await query(
        `INSERT INTO events(client_id,channel_id,landing_page_id,tracking_profile_id,type,session_id,status,user_agent,ip)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          channel.client_id,
          channel.id,
          lp?.id || null,
          tp?.id || null,
          capi.ok ? "capi_ok" : "capi_fail",
          null,
          capi.ok ? "OK" : "FAIL",
          req.headers["user-agent"] || null,
          req.ip || null
        ]
      )
    }else{
      await query(
        `INSERT INTO events(client_id,channel_id,landing_page_id,tracking_profile_id,type,status,user_agent,ip)
         VALUES($1,$2,$3,$4,'join','OK',$5,$6)`,
        [channel.client_id, channel.id, lp?.id || null, tp?.id || null, req.headers["user-agent"]||null, req.ip||null]
      )
    }

    return res.json({ ok:true })
  }catch(err){
    console.error("telegram webhook error", err)
    return res.json({ ok:true })
  }
})

export default router
