import crypto from "crypto"

function sha256(value){
  return crypto.createHash("sha256").update(String(value||"").trim().toLowerCase()).digest("hex")
}

export async function sendMetaCapi({
  pixelId,
  accessToken,
  eventName = "Subscribe",
  eventSourceUrl,
  eventId,
  eventTime,
  externalId,
  clientIp,
  userAgent,
  testEventCode
}){
  if(!pixelId || !accessToken){
    return { ok:false, skipped:true, reason:"missing_pixel_or_token" }
  }

  const url = `https://graph.facebook.com/v18.0/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`
  const user_data = {
    external_id: sha256(externalId || eventId || "unknown")
  }
  if(clientIp) user_data.client_ip_address = clientIp
  if(userAgent) user_data.client_user_agent = userAgent

  const body = {
    data: [{
      event_name: eventName,
      event_time: eventTime || Math.floor(Date.now()/1000),
      event_id: eventId || crypto.randomUUID(),
      event_source_url: eventSourceUrl || "https://example.com/",
      action_source: "website",
      user_data
    }]
  }
  if(testEventCode) body.test_event_code = testEventCode

  const resp = await fetch(url, {
    method:"POST",
    headers: { "content-type":"application/json" },
    body: JSON.stringify(body)
  })

  const json = await resp.json().catch(()=>({}))
  if(!resp.ok){
    return { ok:false, status: resp.status, error: json }
  }
  return { ok:true, status: resp.status, data: json }
}
