import "dotenv/config"
import { createApp } from "./app.js"
import { migrate } from "./db/migrate.js"

const PORT = process.env.PORT || 10000

async function boot(){
  if(!process.env.DATABASE_URL){
    console.error("Missing DATABASE_URL")
    process.exit(1)
  }
  if(!process.env.JWT_SECRET){
    console.error("Missing JWT_SECRET")
    process.exit(1)
  }

  await migrate()

  const app = createApp()
  app.listen(PORT, () => {
    console.log(`UTS backend listening on :${PORT}`)
  })
}

boot().catch(err=>{
  console.error("Boot error:", err)
  process.exit(1)
})
