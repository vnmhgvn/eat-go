import { z } from 'zod'

export const addOrderItemSchema = z.object({
    sessionId: z.string().uuid(),
    menuItemId: z.string().uuid(),
    quantity: z.coerce.number().int().min(1).max(99),
    note: z.string().max(200).optional(),
    selectedToppingOptionIds: z.array(z.string().uuid()).default([]),
})

export const updateOrderItemSchema = z.object({
    quantity: z.coerce.number().int().min(1).max(99),
    note: z.string().max(200).optional(),
    selectedToppingOptionIds: z.array(z.string().uuid()).default([]),
})

export type AddOrderItemInput = z.infer<typeof addOrderItemSchema>
export type UpdateOrderItemInput = z.infer<typeof updateOrderItemSchema>
