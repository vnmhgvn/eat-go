// Drop the trigger causing the issue
const postgres = require('postgres');
const sql = postgres('postgresql://postgres.lkuzjrgcsdhswldawhmc:%24F%3Fz2%3F7Tf79_C6-@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1');

async function run() {
    try {
        console.log("Dropping trigger 'on_auth_user_created' on auth.users...");
        await sql`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`;

        console.log("Dropping function 'public.handle_new_user'...");
        await sql`DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE`;

        console.log("Successfully removed conflicting Supabase starter triggers.");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit(0);
    }
}

run();
