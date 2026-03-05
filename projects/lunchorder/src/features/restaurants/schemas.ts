import { z } from 'zod'

export const createRestaurantSchema = z.object({
    name: z.string().min(1, 'Tên nhà hàng là bắt buộc').max(100),
    category: z.string().max(50).optional(),
    address: z.string().max(200).optional(),
    phoneNumber: z.string().max(20).optional(),
    defaultShipFee: z.coerce.number().int().min(0).default(0),
    note: z.string().max(500).optional(),
    isGlobal: z.boolean().default(false),
})

export const createMenuItemSchema = z.object({
    restaurantId: z.string().uuid(),
    name: z.string().min(1, 'Tên món là bắt buộc').max(100),
    price: z.coerce.number().int().min(0, 'Giá phải >= 0'),
    category: z.string().max(50).optional(),
    description: z.string().max(500).optional(),
    imageUrl: z.string().url().optional().or(z.literal('')),
    isAvailable: z.boolean().default(true),
})

export const createToppingGroupSchema = z.object({
    menuItemId: z.string().uuid(),
    groupName: z.string().min(1).max(50),
    isRequired: z.boolean().default(false),
    minSelect: z.coerce.number().int().min(0).default(0),
    maxSelect: z.coerce.number().int().min(1).default(1),
    sortOrder: z.coerce.number().int().min(0).default(0),
})

export const createToppingOptionSchema = z.object({
    toppingGroupId: z.string().uuid(),
    name: z.string().min(1).max(50),
    extraPrice: z.coerce.number().int().min(0).default(0),
    isAvailable: z.boolean().default(true),
    sortOrder: z.coerce.number().int().min(0).default(0),
})

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>
export type CreateToppingGroupInput = z.infer<typeof createToppingGroupSchema>
export type CreateToppingOptionInput = z.infer<typeof createToppingOptionSchema>
