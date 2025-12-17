import crypto from "crypto"

// AES-256-GCM encryption for storing secrets at rest.
// MASTER_KEY must be 32+ bytes (we hash it to 32).
function keyFrom(master){
  return crypto.createHash("sha256").update(String(master)).digest()
}

export function encrypt(plaintext, masterKey){
  const key = keyFrom(masterKey)
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
  const enc = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString("base64")
}

export function decrypt(tokenEnc, masterKey){
  const key = keyFrom(masterKey)
  const buf = Buffer.from(String(tokenEnc), "base64")
  const iv = buf.subarray(0,12)
  const tag = buf.subarray(12,28)
  const enc = buf.subarray(28)
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(enc), decipher.final()])
  return dec.toString("utf8")
}
