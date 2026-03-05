import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { sessions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { joinSession } from '@/features/sessions/actions'

async function joinSessionAction(shareToken: string, _formData: FormData) {
    'use server'
    const result = await joinSession(shareToken)
    if (result.success && result.data?.sessionId) {
        redirect(`/sessions/${result.data.sessionId}`)
    }
    redirect('/login?redirect=/share/' + shareToken)
}

// This is a public page — no auth required
export default async function SharePage({
    params,
}: {
    params: Promise<{ shareToken: string }>
}) {
    const { shareToken } = await params
    const [session] = await db.select().from(sessions).where(eq(sessions.shareToken, shareToken))

    if (!session) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="text-center">
                    <div className="text-5xl mb-4">❓</div>
                    <h1 className="text-xl font-bold text-white mb-2">Link không hợp lệ</h1>
                    <p className="text-gray-400 text-sm">Phiên order này không tồn tại hoặc đã hết hạn.</p>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
                {/* Brand */}
                <div className="mb-8">
                    <h1 className="text-2xl font-extrabold">
                        <span style={{ color: '#6CC208' }}>eat</span>
                        <span className="text-white">together.</span>
                    </h1>
                </div>

                <h2 className="text-lg font-bold text-white mb-1">Bạn được mời vào phiên</h2>
                <p className="text-2xl font-extrabold text-green-400 mb-6">{session.title}</p>

                <div className="text-sm text-gray-400 mb-6 space-y-1">
                    <p>Trạng thái: <span className="text-white font-medium">{session.status}</span></p>
                    <p>Chia bill: <span className="text-white font-medium">{session.splitMethod === 'EQUAL' ? 'Chia đều' : 'Chia theo món'}</span></p>
                </div>

                {/* Join form (requires login) */}
                <form action={joinSessionAction.bind(null, shareToken)}>
                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-green-500/20"
                    >
                        Tham gia & Chọn món
                    </button>
                </form>

                <p className="text-xs text-gray-500 mt-4">
                    Cần đăng nhập để tham gia phiên
                </p>
            </div>
        </main>
    )
}
