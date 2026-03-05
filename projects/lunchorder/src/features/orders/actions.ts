'use server'

import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import {
    orderItems,
    orderItemToppings,
    menuItems,
    toppingOptions,
    sessions,
} from '@/lib/db/schema'
import { addOrderItemSchema, updateOrderItemSchema } from './schemas'
import type { ActionResult } from '@/types'

/**
 * Add an order item to a session.
 * Snapshots unitBasePrice and unitFinalPrice at order time (BR05, T02).
 */
export async function addOrderItem(formData: unknown): Promise<ActionResult<{ id: string }>> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const parsed = addOrderItemSchema.safeParse(formData)
    if (!parsed.success) {
        return { success: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> }
    }

    const { sessionId, menuItemId, quantity, note, selectedToppingOptionIds } = parsed.data

    // Verify session is ORDERING
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
    if (!session) return { success: false, error: 'Phiên không tồn tại' }
    if (session.status !== 'ORDERING') return { success: false, error: 'Phiên không đang mở order' }

    // Snapshot price from menu item
    const [menuItem] = await db.select().from(menuItems).where(eq(menuItems.id, menuItemId))
    if (!menuItem) return { success: false, error: 'Món không tồn tại' }

    // Calculate topping prices (snapshot)
    let toppingTotal = 0
    const selectedToppings: { id: string; name: string; extraPrice: number }[] = []

    if (selectedToppingOptionIds.length > 0) {
        const options = await db
            .select()
            .from(toppingOptions)
            .where(
                and(
                    ...selectedToppingOptionIds.map((id) => eq(toppingOptions.id, id))
                )
            )
        // Note: for a clean multi-IN query, use inArray from drizzle-orm
        for (const opt of options) {
            toppingTotal += opt.extraPrice
            selectedToppings.push({ id: opt.id, name: opt.name, extraPrice: opt.extraPrice })
        }
    }

    const unitBasePrice = menuItem.price
    const unitFinalPrice = unitBasePrice + toppingTotal

    const [newItem] = await db
        .insert(orderItems)
        .values({
            sessionId,
            userId: user.id,
            menuItemId,
            quantity,
            note: note ?? null,
            unitBasePrice,
            unitFinalPrice,
        })
        .returning({ id: orderItems.id })

    // Insert topping snapshots
    if (selectedToppings.length > 0) {
        await db.insert(orderItemToppings).values(
            selectedToppings.map((t) => ({
                orderItemId: newItem.id,
                toppingOptionId: t.id,
                toppingName: t.name,
                extraPrice: t.extraPrice,
            }))
        )
    }

    revalidatePath(`/sessions/${sessionId}`)
    return { success: true, data: { id: newItem.id } }
}

/**
 * Update an order item (delete+re-insert toppings for simplicity)
 */
export async function updateOrderItem(
    orderItemId: string,
    formData: unknown
): Promise<ActionResult> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const parsed = updateOrderItemSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> }

    const [item] = await db.select().from(orderItems).where(eq(orderItems.id, orderItemId))
    if (!item) return { success: false, error: 'Order item không tồn tại' }
    if (item.userId !== user.id) return { success: false, error: 'Không có quyền sửa' }

    // Verify session is still ORDERING
    const [session] = await db.select().from(sessions).where(eq(sessions.id, item.sessionId))
    if (session?.status !== 'ORDERING') return { success: false, error: 'Phiên đã chốt' }

    const { quantity, note, selectedToppingOptionIds } = parsed.data

    // Recalculate topping prices
    let toppingTotal = 0
    const newToppings: { id: string; name: string; extraPrice: number }[] = []

    if (selectedToppingOptionIds.length > 0) {
        const options = await db
            .select()
            .from(toppingOptions)
            .where(
                and(...selectedToppingOptionIds.map((id) => eq(toppingOptions.id, id)))
            )
        for (const opt of options) {
            toppingTotal += opt.extraPrice
            newToppings.push({ id: opt.id, name: opt.name, extraPrice: opt.extraPrice })
        }
    }

    const unitFinalPrice = item.unitBasePrice + toppingTotal

    await db
        .update(orderItems)
        .set({ quantity, note: note ?? null, unitFinalPrice, updatedAt: new Date() })
        .where(eq(orderItems.id, orderItemId))

    // Re-insert toppings
    await db.delete(orderItemToppings).where(eq(orderItemToppings.orderItemId, orderItemId))
    if (newToppings.length > 0) {
        await db.insert(orderItemToppings).values(
            newToppings.map((t) => ({
                orderItemId,
                toppingOptionId: t.id,
                toppingName: t.name,
                extraPrice: t.extraPrice,
            }))
        )
    }

    revalidatePath(`/sessions/${item.sessionId}`)
    return { success: true }
}

/**
 * Remove an order item
 */
export async function removeOrderItem(orderItemId: string): Promise<ActionResult> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const [item] = await db.select().from(orderItems).where(eq(orderItems.id, orderItemId))
    if (!item) return { success: false, error: 'Order item không tồn tại' }
    if (item.userId !== user.id) return { success: false, error: 'Không có quyền xóa' }

    const [session] = await db.select().from(sessions).where(eq(sessions.id, item.sessionId))
    if (session?.status !== 'ORDERING') return { success: false, error: 'Phiên đã chốt, không thể xóa' }

    await db.delete(orderItems).where(eq(orderItems.id, orderItemId))

    revalidatePath(`/sessions/${item.sessionId}`)
    return { success: true }
}
