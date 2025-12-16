import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"

import path from "path"
import { fileURLToPath } from "url"


import authRoutes from "./routes/auth.routes.js"
import meRoutes from "./routes/me.routes.js"
import clientRoutes from "./routes/client.routes.js"
import ownerRoutes from "./routes/owner.routes.js"
import trackingRoutes from "./routes/tracking.routes.js"
import deployRoutes from "./routes/deploy.routes.js"
import telegramRoutes from "./routes/telegram.routes.js"

export function createApp(){
  const app = express()

  app.use(helmet())
  app.use(morgan("combined"))
  app.use(express.json({ limit: "2mb" }))

  const origin = process.env.CORS_ORIGIN || "*"
  app.use(cors({
    origin,
    credentials: true,
    allowedHeaders: ["Content-Type","Authorization"],
    methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"]
  }))

  app.get("/health", (req,res)=>res.json({ ok:true }))

  app.use("/auth", authRoutes)
  app.use("/", meRoutes)

  app.use("/client", clientRoutes)
  app.use("/owner", ownerRoutes)

  app.use("/", trackingRoutes)
  app.use("/deploy", deployRoutes)

  // Telegram webhook
  app.use("/", telegramRoutes)


// Serve built UI (Vite) if present
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uiDist = path.join(__dirname, "..", "web", "dist")
app.use(express.static(uiDist))
// SPA fallback (but do not hijack API routes)
app.get(/^\/(?!auth|client|owner|t|deploy|health).*/, (req,res)=>{
  res.sendFile(path.join(uiDist, "index.html"))
})

  app.use((req,res)=>res.status(404).json({ error:"Not found" }))

  return app
}
