export async function approveJoinRequest({ botToken, chatId, userId }){
  if(!botToken) throw new Error("Missing bot token")
  const url = `https://api.telegram.org/bot${botToken}/approveChatJoinRequest`
  const resp = await fetch(url, {
    method:"POST",
    headers:{ "content-type":"application/json" },
    body: JSON.stringify({ chat_id: chatId, user_id: userId })
  })
  const json = await resp.json().catch(()=>({}))
  if(!resp.ok || !json.ok){
    throw new Error(`Telegram approve failed: ${JSON.stringify(json)}`)
  }
  return json
}
