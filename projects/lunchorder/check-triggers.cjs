const postgres = require('postgres');

const sql = postgres('postgresql://postgres.lkuzjrgcsdhswldawhmc:%24F%3Fz2%3F7Tf79_C6-@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1')

async function run() {
    try {
        const triggers = await sql`
            SELECT
                t.tgname AS trigger_name,
                trel.relname AS table_name,
                tsc.nspname AS schema_name,
                p.proname AS function_name
            FROM pg_trigger t
            JOIN pg_class trel ON t.tgrelid = trel.oid
            JOIN pg_namespace tsc ON trel.relnamespace = tsc.oid
            JOIN pg_proc p ON t.tgfoid = p.oid
            WHERE tsc.nspname = 'auth' AND trel.relname = 'users';
        `;

        console.log("TRIGGERS ON auth.users:");
        console.log(JSON.stringify(triggers, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

run();
