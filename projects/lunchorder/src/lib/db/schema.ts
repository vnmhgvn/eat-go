import {
    pgTable,
    uuid,
    text,
    integer,
    boolean,
    timestamp,
    unique,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
    id: uuid('id').primaryKey(), // Supabase Auth user ID
    email: text('email').unique().notNull(),
    name: text('name').notNull(),
    avatarUrl: text('avatar_url'),
    role: text('role').notNull().default('member'), // 'admin' | 'member'
    bankCode: text('bank_code'),
    accountNumber: text('account_number'),
    accountName: text('account_name'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ─── Restaurants ──────────────────────────────────────────────────────────────

export const restaurants = pgTable('restaurants', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    category: text('category'),
    address: text('address'),
    phoneNumber: text('phone_number'),
    defaultShipFee: integer('default_ship_fee').default(0),
    note: text('note'),
    isGlobal: boolean('is_global').notNull().default(false),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ─── Menu Items ───────────────────────────────────────────────────────────────

export const menuItems = pgTable('menu_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    restaurantId: uuid('restaurant_id')
        .notNull()
        .references(() => restaurants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    price: integer('price').notNull(),
    category: text('category'),
    description: text('description'),
    imageUrl: text('image_url'),
    isAvailable: boolean('is_available').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ─── Topping Groups ───────────────────────────────────────────────────────────

export const toppingGroups = pgTable('topping_groups', {
    id: uuid('id').primaryKey().defaultRandom(),
    menuItemId: uuid('menu_item_id')
        .notNull()
        .references(() => menuItems.id, { onDelete: 'cascade' }),
    groupName: text('group_name').notNull(),
    isRequired: boolean('is_required').notNull().default(false),
    minSelect: integer('min_select').notNull().default(0),
    maxSelect: integer('max_select').notNull().default(1),
    sortOrder: integer('sort_order').notNull().default(0),
})

// ─── Topping Options ──────────────────────────────────────────────────────────

export const toppingOptions = pgTable('topping_options', {
    id: uuid('id').primaryKey().defaultRandom(),
    toppingGroupId: uuid('topping_group_id')
        .notNull()
        .references(() => toppingGroups.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    extraPrice: integer('extra_price').notNull().default(0),
    isAvailable: boolean('is_available').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
})

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const sessions = pgTable('sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    hostId: uuid('host_id')
        .notNull()
        .references(() => users.id),
    restaurantId: uuid('restaurant_id').references(() => restaurants.id),
    isVotingEnabled: boolean('is_voting_enabled').notNull().default(false),
    status: text('status').notNull().default('ORDERING'), // VOTING|ORDERING|LOCKED|PAYING|COMPLETED|CANCELLED
    deadline: timestamp('deadline', { withTimezone: true }),
    shipFee: integer('ship_fee').notNull().default(0),
    serviceFee: integer('service_fee').notNull().default(0),
    grandTotal: integer('grand_total'), // null = auto-calculate
    splitMethod: text('split_method').notNull().default('BY_ITEM'), // EQUAL|BY_ITEM
    shareToken: text('share_token').unique().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── Session Vote Candidates ──────────────────────────────────────────────────

export const sessionVoteCandidates = pgTable('session_vote_candidates', {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
        .notNull()
        .references(() => sessions.id, { onDelete: 'cascade' }),
    restaurantId: uuid('restaurant_id')
        .notNull()
        .references(() => restaurants.id),
    addedBy: uuid('added_by')
        .notNull()
        .references(() => users.id),
})

// ─── Session Votes ────────────────────────────────────────────────────────────

export const sessionVotes = pgTable(
    'session_votes',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        sessionId: uuid('session_id')
            .notNull()
            .references(() => sessions.id, { onDelete: 'cascade' }),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id),
        candidateId: uuid('candidate_id')
            .notNull()
            .references(() => sessionVoteCandidates.id),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    },
    (table) => [unique().on(table.sessionId, table.userId)]
)

// ─── Session Participants ─────────────────────────────────────────────────────

export const sessionParticipants = pgTable(
    'session_participants',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        sessionId: uuid('session_id')
            .notNull()
            .references(() => sessions.id, { onDelete: 'cascade' }),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id),
        paymentStatus: text('payment_status').notNull().default('PENDING'), // PENDING|SENT|PAID
        paymentConfirmedAt: timestamp('payment_confirmed_at', { withTimezone: true }),
        joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
    },
    (table) => [unique().on(table.sessionId, table.userId)]
)

// ─── Order Items ──────────────────────────────────────────────────────────────

export const orderItems = pgTable('order_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
        .notNull()
        .references(() => sessions.id),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id),
    menuItemId: uuid('menu_item_id')
        .notNull()
        .references(() => menuItems.id),
    quantity: integer('quantity').notNull().default(1),
    note: text('note'),
    unitBasePrice: integer('unit_base_price').notNull(), // Snapshot at order time
    unitFinalPrice: integer('unit_final_price').notNull(), // base + toppings
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── Order Item Toppings ──────────────────────────────────────────────────────

export const orderItemToppings = pgTable('order_item_toppings', {
    id: uuid('id').primaryKey().defaultRandom(),
    orderItemId: uuid('order_item_id')
        .notNull()
        .references(() => orderItems.id, { onDelete: 'cascade' }),
    toppingOptionId: uuid('topping_option_id')
        .notNull()
        .references(() => toppingOptions.id),
    toppingName: text('topping_name').notNull(), // Snapshot name
    extraPrice: integer('extra_price').notNull(), // Snapshot price
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
    sessions: many(sessions),
    participants: many(sessionParticipants),
    orderItems: many(orderItems),
    votes: many(sessionVotes),
}))

export const restaurantsRelations = relations(restaurants, ({ many, one }) => ({
    menuItems: many(menuItems),
    createdBy: one(users, { fields: [restaurants.createdBy], references: [users.id] }),
}))

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
    restaurant: one(restaurants, {
        fields: [menuItems.restaurantId],
        references: [restaurants.id],
    }),
    toppingGroups: many(toppingGroups),
}))

export const toppingGroupsRelations = relations(toppingGroups, ({ one, many }) => ({
    menuItem: one(menuItems, {
        fields: [toppingGroups.menuItemId],
        references: [menuItems.id],
    }),
    options: many(toppingOptions),
}))

export const toppingOptionsRelations = relations(toppingOptions, ({ one }) => ({
    group: one(toppingGroups, {
        fields: [toppingOptions.toppingGroupId],
        references: [toppingGroups.id],
    }),
}))

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
    host: one(users, { fields: [sessions.hostId], references: [users.id] }),
    restaurant: one(restaurants, {
        fields: [sessions.restaurantId],
        references: [restaurants.id],
    }),
    participants: many(sessionParticipants),
    voteCandidates: many(sessionVoteCandidates),
    votes: many(sessionVotes),
    orderItems: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
    session: one(sessions, { fields: [orderItems.sessionId], references: [sessions.id] }),
    user: one(users, { fields: [orderItems.userId], references: [users.id] }),
    menuItem: one(menuItems, { fields: [orderItems.menuItemId], references: [menuItems.id] }),
    toppings: many(orderItemToppings),
}))

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Restaurant = typeof restaurants.$inferSelect
export type NewRestaurant = typeof restaurants.$inferInsert
export type MenuItem = typeof menuItems.$inferSelect
export type NewMenuItem = typeof menuItems.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert
export type SessionParticipant = typeof sessionParticipants.$inferSelect

export type SessionStatus = 'VOTING' | 'ORDERING' | 'LOCKED' | 'PAYING' | 'COMPLETED' | 'CANCELLED'
export type SplitMethod = 'EQUAL' | 'BY_ITEM'
export type PaymentStatus = 'PENDING' | 'SENT' | 'PAID'
export type UserRole = 'admin' | 'member'
