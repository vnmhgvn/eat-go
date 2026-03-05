import { defineConfig } from 'drizzle-kit'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local manually since drizzle-kit doesn't auto-load it
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
    for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const idx = trimmed.indexOf('=')
        if (idx === -1) continue
        const key = trimmed.slice(0, idx)
        const value = trimmed.slice(idx + 1)
        if (!process.env[key]) {
            process.env[key] = value
        }
    }
}

// For drizzle-kit push/generate, MUST use direct Postgres connection (port 5432)
// NOT the pgBouncer pooler connection (port 6543) used at runtime.
// DIRECT_DATABASE_URL: postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
const migrationUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL!

export default defineConfig({
    schema: './src/lib/db/schema.ts',
    out: './src/lib/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: migrationUrl,
    },
    verbose: true,
    strict: true,
})
