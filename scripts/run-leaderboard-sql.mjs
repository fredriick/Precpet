// One-off: apply the leaderboard schema via a direct Postgres connection.
// Requires SUPABASE_DB_URL in the environment (postgresql://...).
// Run with: node scripts/run-leaderboard-sql.mjs
import { readFileSync } from "node:fs"
import { Client } from "pg"

const connectionString = process.env.SUPABASE_DB_URL

if (!connectionString) {
  console.error("Missing SUPABASE_DB_URL in environment.")
  process.exit(1)
}

const sql = readFileSync(new URL("../supabase/leaderboard.sql", import.meta.url), "utf8")
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  await client.query(sql)
  console.log("Leaderboard schema applied successfully.")
} catch (err) {
  console.error("SQL execution failed:", err.message)
  process.exit(1)
} finally {
  await client.end()
}
