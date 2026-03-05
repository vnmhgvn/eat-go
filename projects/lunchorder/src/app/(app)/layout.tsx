import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { signOut } from '@/features/auth/actions'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Top Nav */}
            <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <span className="text-2xl font-extrabold tracking-tight">
                                <span style={{ color: '#6CC208' }}>eat</span>
                                <span className="text-gray-900 dark:text-white">together.</span>
                            </span>
                        </Link>

                        {/* Navigation */}
                        <div className="hidden md:flex items-center gap-6">
                            <Link
                                href="/dashboard"
                                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/sessions/new"
                                className="text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
                            >
                                + Tạo phiên
                            </Link>
                        </div>

                        {/* User actions */}
                        <div className="flex items-center gap-3">
                            {user.user_metadata?.avatar_url && (
                                <img
                                    src={user.user_metadata.avatar_url}
                                    alt={user.user_metadata.full_name ?? 'avatar'}
                                    className="w-8 h-8 rounded-full border-2 border-green-500"
                                />
                            )}
                            <Link
                                href="/profile"
                                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 hidden sm:block"
                            >
                                {user.email}
                            </Link>
                            <form action={signOut}>
                                <button
                                    type="submit"
                                    className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded"
                                >
                                    Đăng xuất
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    )
}
