import Link from 'next/link'
import { signInWithGoogle } from '@/features/auth/actions'

export default function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ redirect?: string; error?: string }>
}) {
    return (
        <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-green-950 opacity-90" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-transparent to-transparent" />

            {/* Card */}
            <div className="relative z-10 w-full max-w-md mx-auto px-6">
                {/* Logo */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold tracking-tight">
                        <span style={{ color: '#6CC208' }}>eat</span>
                        <span className="text-white">together.</span>
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm">
                        Đặt đồ ăn nhóm đơn giản, minh bạch, nhanh chóng
                    </p>
                </div>

                {/* Login card */}
                <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-2 text-center">Đăng nhập để bắt đầu</h2>
                    <p className="text-gray-400 text-sm text-center mb-8">
                        Không cần đăng ký — đăng nhập bằng Google là xong.
                    </p>

                    <form action={signInWithGoogle}>
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            {/* Google SVG icon */}
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Tiếp tục với Google
                        </button>
                    </form>

                    <p className="text-gray-500 text-xs text-center mt-6">
                        Bằng cách đăng nhập, bạn đồng ý với{' '}
                        <Link href="#" className="underline hover:text-gray-300">điều khoản sử dụng</Link>.
                    </p>
                </div>
            </div>
        </main>
    )
}
