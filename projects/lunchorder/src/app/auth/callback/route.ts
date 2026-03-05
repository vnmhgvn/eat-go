import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin

    if (code) {
        const supabase = await createSupabaseServerClient()
        const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && user) {
            // Upsert user profile on first login
            await db
                .insert(users)
                .values({
                    id: user.id,
                    email: user.email!,
                    name: user.user_metadata.full_name ?? user.email!.split('@')[0],
                    avatarUrl: user.user_metadata.avatar_url ?? null,
                    role: 'member',
                })
                .onConflictDoUpdate({
                    target: users.id,
                    set: {
                        name: user.user_metadata.full_name ?? user.email!.split('@')[0],
                        avatarUrl: user.user_metadata.avatar_url ?? null,
                    },
                })

            return NextResponse.redirect(`${origin}/dashboard`)
        }
    }

    // Auth error — redirect to login with error
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
