'use server'

import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { restaurants, menuItems, toppingGroups, toppingOptions, sessions, users } from '@/lib/db/schema'
import {
    createRestaurantSchema,
    createMenuItemSchema,
    createToppingGroupSchema,
    createToppingOptionSchema,
} from './schemas'
import type { ActionResult } from '@/types'

// ─── Restaurants ──────────────────────────────────────────────────────────────

export async function createRestaurant(formData: unknown): Promise<ActionResult<{ id: string }>> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const parsed = createRestaurantSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> }

    // Only admin can create global restaurants
    if (parsed.data.isGlobal) {
        const [dbUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, user.id))
        if (dbUser?.role !== 'admin') {
            return { success: false, error: 'Chỉ admin mới có thể thêm nhà hàng global' }
        }
    }

    const [newRestaurant] = await db.insert(restaurants).values({
        ...parsed.data,
        createdBy: user.id,
    }).returning({ id: restaurants.id })

    revalidatePath('/restaurants')
    return { success: true, data: newRestaurant }
}

export async function updateRestaurant(
    restaurantId: string,
    formData: unknown
): Promise<ActionResult> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const parsed = createRestaurantSchema.partial().safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> }

    await db.update(restaurants).set(parsed.data).where(eq(restaurants.id, restaurantId))

    revalidatePath('/restaurants')
    return { success: true }
}

export async function deleteRestaurant(restaurantId: string): Promise<ActionResult> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // BR10: Cannot delete if referenced by active sessions
    const activeSessions = await db
        .select()
        .from(sessions)
        .where(and(
            eq(sessions.restaurantId, restaurantId),
        ))

    const blocked = activeSessions.filter(
        (s) => !['COMPLETED', 'CANCELLED'].includes(s.status)
    )
    if (blocked.length > 0) {
        return { success: false, error: 'Không thể xóa nhà hàng đang được dùng trong phiên chưa hoàn thành' }
    }

    await db.delete(restaurants).where(eq(restaurants.id, restaurantId))
    revalidatePath('/restaurants')
    return { success: true }
}

// ─── Menu Items ───────────────────────────────────────────────────────────────

export async function createMenuItem(formData: unknown): Promise<ActionResult<{ id: string }>> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const parsed = createMenuItemSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> }

    const [newItem] = await db.insert(menuItems).values(parsed.data).returning({ id: menuItems.id })
    revalidatePath('/restaurants')
    return { success: true, data: newItem }
}

export async function updateMenuItem(id: string, formData: unknown): Promise<ActionResult> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const parsed = createMenuItemSchema.partial().safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> }

    await db.update(menuItems).set(parsed.data).where(eq(menuItems.id, id))
    revalidatePath('/restaurants')
    return { success: true }
}

// ─── Topping Groups ───────────────────────────────────────────────────────────

export async function createToppingGroup(formData: unknown): Promise<ActionResult<{ id: string }>> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const parsed = createToppingGroupSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> }

    const [newGroup] = await db.insert(toppingGroups).values(parsed.data).returning({ id: toppingGroups.id })
    return { success: true, data: newGroup }
}

export async function createToppingOption(formData: unknown): Promise<ActionResult<{ id: string }>> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const parsed = createToppingOptionSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> }

    const [newOpt] = await db.insert(toppingOptions).values(parsed.data).returning({ id: toppingOptions.id })
    return { success: true, data: newOpt }
}
