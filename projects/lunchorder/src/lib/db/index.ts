import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Connection pooling is done by Supabase Pooler (port 6543 in DATABASE_URL)
// This client is safe for serverless (Vercel) usage
const client = postgres(process.env.DATABASE_URL!, { prepare: false })

export const db = drizzle(client, { schema })
