import { z } from 'zod'

export const createSessionSchema = z.object({
    title: z.string().min(1, 'Tên phiên không được để trống').max(100),
    isVotingEnabled: z.boolean().default(false),
    splitMethod: z.enum(['EQUAL', 'BY_ITEM']).default('BY_ITEM'),
    restaurantId: z.string().uuid().optional(),
    deadline: z.string().datetime({ offset: true }).optional(),
    shipFee: z.coerce.number().int().min(0).default(0),
    serviceFee: z.coerce.number().int().min(0).default(0),
})

export const updateBillSettingsSchema = z.object({
    shipFee: z.coerce.number().int().min(0),
    serviceFee: z.coerce.number().int().min(0),
    grandTotal: z.coerce.number().int().min(0).optional(),
    splitMethod: z.enum(['EQUAL', 'BY_ITEM']),
})

export const addVoteCandidateSchema = z.object({
    sessionId: z.string().uuid(),
    restaurantId: z.string().uuid(),
})

export const castVoteSchema = z.object({
    sessionId: z.string().uuid(),
    candidateId: z.string().uuid(),
})

export const closeVotingSchema = z.object({
    sessionId: z.string().uuid(),
    winnerCandidateId: z.string().uuid().optional(), // Required when tie
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type UpdateBillSettingsInput = z.infer<typeof updateBillSettingsSchema>
