import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import {
    sessions,
    sessionParticipants,
    restaurants,
    orderItems,
} from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { SESSION_STATUS_CONFIG } from '@/types'
import { lockSession, cancelSession, unlockSession } from '@/features/sessions/actions'

async function lockSessionAction(sessionId: string, _fd: FormData): Promise<void> {
    'use server'
    await lockSession(sessionId)
}
async function unlockSessionAction(sessionId: string, _fd: FormData): Promise<void> {
    'use server'
    await unlockSession(sessionId)
}
async function cancelSessionAction(sessionId: string, _fd: FormData): Promise<void> {
    'use server'
    await cancelSession(sessionId)
}

export default async function SessionDetailPage({
    params,
}: {
    params: Promise<{ sessionId: string }>
}) {
    const { sessionId } = await params

    // Validate UUID to prevent Postgres "invalid input syntax for type uuid" error (e.g., when visiting /sessions/new)
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)
    if (!isValidUUID) notFound()

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
    if (!session) notFound()

    const isHost = user?.id === session.hostId

    const participants = await db
        .select({ userId: sessionParticipants.userId, joinedAt: sessionParticipants.joinedAt })
        .from(sessionParticipants)
        .where(eq(sessionParticipants.sessionId, sessionId))

    const config = SESSION_STATUS_CONFIG[session.status as keyof typeof SESSION_STATUS_CONFIG]

    // Get restaurant info
    let restaurant: { name: string } | null = null
    if (session.restaurantId) {
        const [r] = await db
            .select({ name: restaurants.name })
            .from(restaurants)
            .where(eq(restaurants.id, session.restaurantId))
        restaurant = r ?? null
    }

    // Get order items for current user
    const myOrders = user
        ? await db
            .select()
            .from(orderItems)
            .where(and(eq(orderItems.sessionId, sessionId), eq(orderItems.userId, user.id)))
        : []

    const mySubtotal = myOrders.reduce((sum, item) => sum + item.unitFinalPrice * item.quantity, 0)

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{session.title}</h1>
                        <span className="text-sm font-medium px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            {config.label}
                        </span>
                    </div>
                    {restaurant && (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            🍽️ {restaurant.name}
                        </p>
                    )}
                    <p className="text-gray-400 text-xs mt-1">
                        {participants.length} thành viên • {session.splitMethod === 'EQUAL' ? 'Chia đều' : 'Chia theo món'}
                    </p>
                </div>

                {/* Host actions */}
                {isHost && (
                    <div className="flex gap-2 flex-wrap justify-end">
                        {session.status === 'ORDERING' && (
                            <form action={lockSessionAction.bind(null, sessionId)}>
                                <button
                                    type="submit"
                                    className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                                >
                                    Chốt đơn
                                </button>
                            </form>
                        )}
                        {session.status === 'LOCKED' && (
                            <>
                                <form action={unlockSessionAction.bind(null, sessionId)}>
                                    <button type="submit" className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                                        Mở lại
                                    </button>
                                </form>
                                <Link
                                    href={`/sessions/${sessionId}/bill`}
                                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                                >
                                    Xem Bill
                                </Link>
                            </>
                        )}
                        {(session.status === 'ORDERING' || session.status === 'VOTING') && (
                            <form action={cancelSessionAction.bind(null, sessionId)}>
                                <button type="submit" className="border border-red-300 text-red-500 hover:bg-red-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                                    Hủy phiên
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>

            {/* Share link */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
                <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">🔗 Link chia sẻ phiên</p>
                <code className="text-xs text-gray-600 dark:text-gray-400 break-all">
                    {process.env.NEXT_PUBLIC_APP_URL}/share/{session.shareToken}
                </code>
            </div>

            {/* My orders */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-900 dark:text-white">Đơn của tôi</h2>
                    {session.status === 'ORDERING' && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Đang mở order</span>
                    )}
                </div>

                {myOrders.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8">
                        {session.status === 'ORDERING'
                            ? 'Chưa có món nào — cuộn xuống để xem menu'
                            : 'Không có món nào trong đơn của bạn'}
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {myOrders.map((item) => (
                            <li key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                <div>
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {item.quantity}× {item.menuItemId}
                                    </span>
                                    {item.note && <p className="text-xs text-gray-400 mt-0.5">{item.note}</p>}
                                </div>
                                <span className="text-sm font-semibold text-green-600">
                                    {(item.unitFinalPrice * item.quantity).toLocaleString('vi-VN')}đ
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                {myOrders.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <span className="text-sm text-gray-500">Subtotal của bạn</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                            {mySubtotal.toLocaleString('vi-VN')}đ
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
