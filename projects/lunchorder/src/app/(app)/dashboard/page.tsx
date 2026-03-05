import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { sessions, sessionParticipants, users } from '@/lib/db/schema'
import { eq, or, desc } from 'drizzle-orm'
import { SESSION_STATUS_CONFIG } from '@/types'

const STATUS_BADGE_COLORS: Record<string, string> = {
    VOTING: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    ORDERING: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    LOCKED: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    PAYING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    COMPLETED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

export default async function DashboardPage() {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Get sessions where user is host or participant
    const participantRows = await db
        .select({ sessionId: sessionParticipants.sessionId })
        .from(sessionParticipants)
        .where(eq(sessionParticipants.userId, user.id))

    const participantSessionIds = participantRows.map((r) => r.sessionId)

    const mySessions = await db
        .select()
        .from(sessions)
        .where(eq(sessions.hostId, user.id))
        .orderBy(desc(sessions.createdAt))
        .limit(20)

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Các phiên order của bạn</p>
                </div>
                <Link
                    href="/sessions/new"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-green-500/20 transition-all hover:-translate-y-0.5"
                >
                    <span>+</span>
                    Tạo phiên mới
                </Link>
            </div>

            {/* Active sessions */}
            {mySessions.length === 0 ? (
                <div className="text-center py-24 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <div className="text-5xl mb-4">🍜</div>
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Chưa có phiên nào
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Tạo phiên order đầu tiên để bắt đầu!
                    </p>
                    <Link
                        href="/sessions/new"
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all"
                    >
                        Tạo phiên ngay
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {mySessions.map((session) => {
                        const config = SESSION_STATUS_CONFIG[session.status as keyof typeof SESSION_STATUS_CONFIG]
                        const badgeClass = STATUS_BADGE_COLORS[session.status] ?? 'bg-gray-100 text-gray-600'
                        return (
                            <Link key={session.id} href={`/sessions/${session.id}`}>
                                <div className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-green-500 hover:shadow-lg transition-all duration-200 cursor-pointer">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="font-semibold text-gray-900 dark:text-white truncate pr-2">
                                            {session.title}
                                        </h3>
                                        <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${badgeClass}`}>
                                            {config.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        {session.createdAt ? new Date(session.createdAt).toLocaleDateString('vi-VN') : '—'}
                                    </p>
                                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                        <span className="text-xs text-gray-400">
                                            {session.splitMethod === 'EQUAL' ? '⚖️ Chia đều' : '🧾 Chia theo món'}
                                        </span>
                                        <span className="text-xs font-medium text-green-600 group-hover:underline">
                                            Xem chi tiết →
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
