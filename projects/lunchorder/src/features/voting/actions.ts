'use server'

import { revalidatePath } from 'next/cache'
import { eq, and, count } from 'drizzle-orm'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import {
    sessions,
    sessionVoteCandidates,
    sessionVotes,
} from '@/lib/db/schema'
import { addVoteCandidateSchema, castVoteSchema, closeVotingSchema } from '@/features/sessions/schemas'
import type { ActionResult } from '@/types'

/**
 * Add a restaurant as vote candidate (host only)
 */
export async function addVoteCandidate(formData: unknown): Promise<ActionResult> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const parsed = addVoteCandidateSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> }

    const { sessionId, restaurantId } = parsed.data
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
    if (!session) return { success: false, error: 'Phiên không tồn tại' }
    if (session.hostId !== user.id) return { success: false, error: 'Chỉ host mới có thể thêm ứng cử viên' }
    if (session.status !== 'VOTING') return { success: false, error: 'Phiên không ở trạng thái VOTING' }

    await db.insert(sessionVoteCandidates).values({ sessionId, restaurantId, addedBy: user.id })

    revalidatePath(`/sessions/${sessionId}`)
    return { success: true }
}

/**
 * Cast or change vote (upsert pattern — UNIQUE(sessionId, userId))
 */
export async function castVote(formData: unknown): Promise<ActionResult> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const parsed = castVoteSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> }

    const { sessionId, candidateId } = parsed.data
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
    if (!session) return { success: false, error: 'Phiên không tồn tại' }
    if (session.status !== 'VOTING') return { success: false, error: 'Phiên không đang mở vote' }

    // Upsert: delete existing vote then insert
    await db.delete(sessionVotes).where(and(eq(sessionVotes.sessionId, sessionId), eq(sessionVotes.userId, user.id)))
    await db.insert(sessionVotes).values({ sessionId, userId: user.id, candidateId })

    revalidatePath(`/sessions/${sessionId}`)
    return { success: true }
}

/**
 * Close voting and set the winner restaurant
 * If tie: winnerCandidateId must be provided (BR07)
 */
export async function closeVoting(formData: unknown): Promise<ActionResult> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const parsed = closeVotingSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> }

    const { sessionId, winnerCandidateId } = parsed.data
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
    if (!session) return { success: false, error: 'Phiên không tồn tại' }
    if (session.hostId !== user.id) return { success: false, error: 'Chỉ host mới có thể đóng vote' }
    if (session.status !== 'VOTING') return { success: false, error: 'Phiên không đang VOTING' }

    // Get candidates with vote counts
    const candidates = await db.select().from(sessionVoteCandidates).where(
        eq(sessionVoteCandidates.sessionId, sessionId)
    )

    const voteCounts = await Promise.all(
        candidates.map(async (c) => {
            const [result] = await db
                .select({ total: count() })
                .from(sessionVotes)
                .where(eq(sessionVotes.candidateId, c.id))
            return { ...c, voteCount: result?.total ?? 0 }
        })
    )

    // Sort by votes descending
    voteCounts.sort((a, b) => b.voteCount - a.voteCount)
    const topVote = voteCounts[0]?.voteCount ?? 0
    const winners = voteCounts.filter((c) => c.voteCount === topVote)

    let winnerRestaurantId: string

    if (winners.length > 1) {
        // Tie situation — host must specify winner (BR07)
        if (!winnerCandidateId) {
            return { success: false, error: 'Kết quả hòa — host phải chọn nhà hàng thủ công' }
        }
        const winnerCandidate = candidates.find((c) => c.id === winnerCandidateId)
        if (!winnerCandidate) return { success: false, error: 'Ứng cử viên không hợp lệ' }
        winnerRestaurantId = winnerCandidate.restaurantId
    } else {
        winnerRestaurantId = topVote > 0 && winnerCandidateId
            ? (candidates.find((c) => c.id === winnerCandidateId)?.restaurantId ?? winners[0].restaurantId)
            : winners[0].restaurantId
    }

    await db
        .update(sessions)
        .set({ restaurantId: winnerRestaurantId, status: 'ORDERING', updatedAt: new Date() })
        .where(eq(sessions.id, sessionId))

    revalidatePath(`/sessions/${sessionId}`)
    return { success: true }
}
