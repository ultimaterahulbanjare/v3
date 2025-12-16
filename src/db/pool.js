import pg from "pg"

const { Pool } = pg

function isRenderPostgres(url){
  return typeof url === "string" && url.includes("render.com")
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render Postgres requires SSL in many setups
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
})

export async function query(text, params){
  const res = await pool.query(text, params)
  return res
}
