import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { eq, or } from 'drizzle-orm'
import { restaurants } from '@/lib/db/schema'
import { createSession } from '@/features/sessions/actions'
import { redirect } from 'next/navigation'

export default async function NewSessionPage() {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch restaurants for dropdown (global ones + ones I created)
    const allRestaurants = await db
        .select()
        .from(restaurants)
        .where(or(
            eq(restaurants.isGlobal, true),
            eq(restaurants.createdBy, user.id)
        ))

    // Wrapper function for the action
    async function createSessionAction(formData: FormData) {
        'use server'

        const isVotingEnabled = formData.get('isVotingEnabled') === 'on'
        const splitMethod = formData.get('splitMethod') as 'EQUAL' | 'BY_ITEM'
        const data = {
            title: formData.get('title'),
            restaurantId: formData.get('restaurantId') || undefined,
            isVotingEnabled,
            deadline: formData.get('deadline') || undefined,
            shipFee: Number(formData.get('shipFee')) || 0,
            serviceFee: Number(formData.get('serviceFee')) || 0,
            splitMethod,
        }

        const result = await createSession(data)
        if (result.success && result.data) {
            redirect(`/sessions/${result.data.id}`)
        } else {
            // In a real app we'd display errors, for MVP we throw
            throw new Error(JSON.stringify(result.error))
        }
    }

    return (
        <div className="max-w-xl mx-auto py-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Tạo phiên order mới</h1>

            <form action={createSessionAction} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-5">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên phiên (bắt buộc)</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        placeholder="VD: Trưa thứ 6, Cơm thố..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>

                <div>
                    <label htmlFor="isVotingEnabled" className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" id="isVotingEnabled" name="isVotingEnabled" className="w-4 h-4 text-green-600 rounded" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bật tính năng bỏ phiếu (Voting) quán ăn</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 pl-6">Nếu bật, bạn không cần chọn quán ngay bây giờ.</p>
                </div>

                <div>
                    <label htmlFor="restaurantId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chọn quán ăn (tùy chọn)</label>
                    <select
                        id="restaurantId"
                        name="restaurantId"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                        <option value="">-- Chọn một quán --</option>
                        {allRestaurants.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="shipFee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phí vận chuyển (đ)</label>
                        <input
                            type="number"
                            id="shipFee"
                            name="shipFee"
                            defaultValue="0"
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label htmlFor="serviceFee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phí dịch vụ (đ)</label>
                        <input
                            type="number"
                            id="serviceFee"
                            name="serviceFee"
                            defaultValue="0"
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="splitMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phương thức chia tiền</label>
                    <select
                        id="splitMethod"
                        name="splitMethod"
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                        <option value="BY_ITEM">🧾 Theo món (Mỗi người trả phần mình + ship chia đều)</option>
                        <option value="EQUAL">⚖️ Chia đều (Tổng bill chia đều số người)</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hạn chót khóa phiên (tùy chọn)</label>
                    <input
                        type="datetime-local"
                        id="deadline"
                        name="deadline"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all"
                    >
                        Tạo phiên
                    </button>
                </div>
            </form>
        </div>
    )
}
