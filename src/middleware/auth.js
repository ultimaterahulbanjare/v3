import jwt from "jsonwebtoken"

export function signAccessToken(payload){
  const secret = process.env.JWT_SECRET || "dev-secret"
  return jwt.sign(payload, secret, { expiresIn: "7d" })
}

export function requireAuth(req, res, next){
  const h = req.headers.authorization || ""
  const token = h.startsWith("Bearer ") ? h.slice(7) : null
  if(!token) return res.status(401).json({ error:"Unauthorized" })
  try{
    const secret = process.env.JWT_SECRET || "dev-secret"
    const decoded = jwt.verify(token, secret)
    req.user = decoded
    return next()
  }catch(e){
    return res.status(401).json({ error:"Invalid token" })
  }
}

export function requireRole(role){
  return (req,res,next)=>{
    if(!req.user) return res.status(401).json({ error:"Unauthorized" })
    if(req.user.role !== role) return res.status(403).json({ error:"Forbidden" })
    return next()
  }
}
