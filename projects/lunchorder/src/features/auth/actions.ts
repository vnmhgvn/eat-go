'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { updateBankInfoSchema } from './schemas'
import type { ActionResult } from '@/types'

export async function signInWithGoogle() {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
    })

    if (error) {
        throw new Error(error.message)
    }

    if (data.url) {
        redirect(data.url)
    }
}

export async function signOut() {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()
    redirect('/login')
}

export async function updateBankInfo(formData: unknown): Promise<ActionResult> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const parsed = updateBankInfoSchema.safeParse(formData)
    if (!parsed.success) {
        return { success: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> }
    }

    await db
        .update(users)
        .set({
            bankCode: parsed.data.bankCode,
            accountNumber: parsed.data.accountNumber,
            accountName: parsed.data.accountName,
        })
        .where(eq(users.id, user.id))

    return { success: true }
}

// Import eq at top — keeping it separate for readability
import { eq } from 'drizzle-orm'
