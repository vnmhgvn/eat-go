'use server'

import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import {
    sessions,
    sessionParticipants,
    restaurants,
} from '@/lib/db/schema'
import {
    createSessionSchema,
    updateBillSettingsSchema,
} from './schemas'
import type { ActionResult } from '@/types'

/**
 * Create a new order session
 */
export async function createSession(formData: unknown): Promise<ActionResult<{ id: string; shareToken: string }>> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const parsed = createSessionSchema.safeParse(formData)
    if (!parsed.success) {
        return { success: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> }
    }

    const shareToken = nanoid(12)

    const [newSession] = await db
        .insert(sessions)
        .values({
            title: parsed.data.title,
            hostId: user.id,
            restaurantId: parsed.data.restaurantId ?? null,
            isVotingEnabled: parsed.data.isVotingEnabled,
            status: parsed.data.isVotingEnabled ? 'VOTING' : 'ORDERING',
            deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
            shipFee: parsed.data.shipFee,
            serviceFee: parsed.data.serviceFee,
            splitMethod: parsed.data.splitMethod,
            shareToken,
        })
        .returning({ id: sessions.id, shareToken: sessions.shareToken })

    // Auto-join host as participant
    await db.insert(sessionParticipants).values({
        sessionId: newSession.id,
        userId: user.id,
    })

    revalidatePath('/dashboard')
    return { success: true, data: newSession }
}

/**
 * Lock session — ORDERING → LOCKED
 */
export async function lockSession(sessionId: string): Promise<ActionResult> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))

    if (!session) return { success: false, error: 'Phiên không tồn tại' }
    if (session.hostId !== user.id) return { success: false, error: 'Chỉ host mới có thể chốt đơn' }
    if (session.status !== 'ORDERING') return { success: false, error: 'Phiên không ở trạng thái ORDERING' }

    await db
        .update(sessions)
        .set({ status: 'LOCKED', updatedAt: new Date() })
        .where(eq(sessions.id, sessionId))

    revalidatePath(`/sessions/${sessionId}`)
    revalidatePath('/dashboard')
    return { success: true }
}

/**
 * Unlock session — LOCKED → ORDERING (only if no one has PAID)
 */
export async function unlockSession(sessionId: string): Promise<ActionResult> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
    if (!session) return { success: false, error: 'Phiên không tồn tại' }
    if (session.hostId !== user.id) return { success: false, error: 'Chỉ host mới có thể mở lại phiên' }
    if (session.status !== 'LOCKED') return { success: false, error: 'Phiên chưa bị khóa' }

    // BR08: only unlock if no one has paid
    const paidParticipants = await db
        .select()
        .from(sessionParticipants)
        .where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.paymentStatus, 'PAID')))

    if (paidParticipants.length > 0) {
        return { success: false, error: 'Không thể mở lại khi đã có thành viên thanh toán' }
    }

    await db.update(sessions).set({ status: 'ORDERING', updatedAt: new Date() }).where(eq(sessions.id, sessionId))

    revalidatePath(`/sessions/${sessionId}`)
    return { success: true }
}

/**
 * Cancel session
 */
export async function cancelSession(sessionId: string): Promise<ActionResult> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
    if (!session) return { success: false, error: 'Phiên không tồn tại' }
    if (session.hostId !== user.id) return { success: false, error: 'Chỉ host mới có thể hủy phiên' }

    await db.update(sessions).set({ status: 'CANCELLED', updatedAt: new Date() }).where(eq(sessions.id, sessionId))

    revalidatePath('/dashboard')
    return { success: true }
}

/**
 * Join a session via shareToken
 */
export async function joinSession(shareToken: string): Promise<ActionResult<{ sessionId: string }>> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const [session] = await db.select().from(sessions).where(eq(sessions.shareToken, shareToken))
    if (!session) return { success: false, error: 'Link chia sẻ không hợp lệ' }

    // Check if already a participant
    const [existing] = await db
        .select()
        .from(sessionParticipants)
        .where(and(eq(sessionParticipants.sessionId, session.id), eq(sessionParticipants.userId, user.id)))

    if (!existing) {
        await db.insert(sessionParticipants).values({ sessionId: session.id, userId: user.id })
    }

    revalidatePath(`/sessions/${session.id}`)
    return { success: true, data: { sessionId: session.id } }
}

/**
 * Update bill settings
 */
export async function updateBillSettings(
    sessionId: string,
    formData: unknown
): Promise<ActionResult> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const parsed = updateBillSettingsSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> }

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
    if (!session || session.hostId !== user.id) return { success: false, error: 'Không có quyền' }

    await db
        .update(sessions)
        .set({
            shipFee: parsed.data.shipFee,
            serviceFee: parsed.data.serviceFee,
            grandTotal: parsed.data.grandTotal ?? null,
            splitMethod: parsed.data.splitMethod,
            updatedAt: new Date(),
        })
        .where(eq(sessions.id, sessionId))

    revalidatePath(`/sessions/${sessionId}/bill`)
    return { success: true }
}
