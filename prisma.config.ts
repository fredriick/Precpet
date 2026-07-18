import { defineConfig } from "prisma/config"

// Prisma 7.8 config. The driver adapter is wired via the Prisma Client in
// lib/prisma.ts (using @prisma/adapter-pg). Here we only declare the datasource
// so `prisma db push` / `prisma migrate dev` know which database to target.
//
// NOTE: 5432 is firewalled from CI/dev sandboxes. Run these commands from a
// machine with Supabase Postgres access (your local machine or a runner).
// The managed `auth.users` table is excluded from the schema (see notes
// in schema.prisma), so Prisma only creates the app's own tables.
export default defineConfig({
  datasource: {
    url: process.env.SUPABASE_DB_URL,
  },
  schema: "prisma/schema.prisma",
})
