'use server'

import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { sessions, sessionParticipants } from '@/lib/db/schema'
import type { ActionResult } from '@/types'

/**
 * Member declares they have made the transfer (not auto-confirmed)
 */
export async function markAsSent(sessionId: string): Promise<ActionResult> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    await db
        .update(sessionParticipants)
        .set({ paymentStatus: 'SENT' })
        .where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.userId, user.id)))

    revalidatePath(`/sessions/${sessionId}/bill`)
    return { success: true }
}

/**
 * Host confirms payment received from a specific member
 */
export async function markAsPaid(sessionId: string, memberId: string): Promise<ActionResult> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
    if (!session) return { success: false, error: 'Phiên không tồn tại' }
    if (session.hostId !== user.id) return { success: false, error: 'Chỉ host mới có thể xác nhận thanh toán' }

    await db
        .update(sessionParticipants)
        .set({ paymentStatus: 'PAID', paymentConfirmedAt: new Date() })
        .where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.userId, memberId)))

    revalidatePath(`/sessions/${sessionId}/bill`)
    return { success: true }
}

/**
 * Host completes session (all members PAID)
 */
export async function completeSession(sessionId: string): Promise<ActionResult> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
    if (!session) return { success: false, error: 'Phiên không tồn tại' }
    if (session.hostId !== user.id) return { success: false, error: 'Chỉ host mới có thể kết thúc phiên' }

    // Verify all participants have PAID
    const unpaid = await db
        .select()
        .from(sessionParticipants)
        .where(and(eq(sessionParticipants.sessionId, sessionId)))

    const hasUnpaid = unpaid.some((p) => p.paymentStatus !== 'PAID')
    if (hasUnpaid) {
        return { success: false, error: 'Vẫn còn thành viên chưa thanh toán' }
    }

    await db
        .update(sessions)
        .set({ status: 'COMPLETED', updatedAt: new Date() })
        .where(eq(sessions.id, sessionId))

    revalidatePath(`/sessions/${sessionId}`)
    revalidatePath('/dashboard')
    return { success: true }
}
