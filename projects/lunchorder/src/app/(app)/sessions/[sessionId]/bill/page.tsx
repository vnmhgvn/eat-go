import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { sessions, sessionParticipants, orderItems, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { calculateEqualSplit, calculateByItemSplit } from '@/lib/bill'
import { buildVietQRUrl } from '@/features/payment/utils/viet-qr'
import { markAsPaid, markAsSent, completeSession } from '@/features/payment/actions'

// Void-returning wrappers for use in form action props
async function markAsSentAction(sessionId: string, _fd: FormData): Promise<void> {
    'use server'
    await markAsSent(sessionId)
}
async function markAsPaidAction(sessionId: string, memberId: string, _fd: FormData): Promise<void> {
    'use server'
    await markAsPaid(sessionId, memberId)
}
async function completeSessionAction(sessionId: string, _fd: FormData): Promise<void> {
    'use server'
    await completeSession(sessionId)
}

export default async function BillPage({
    params,
}: {
    params: Promise<{ sessionId: string }>
}) {
    const { sessionId } = await params

    // Validate UUID to prevent Postgres "invalid input syntax for type uuid" error
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)
    if (!isValidUUID) notFound()

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
    if (!session) notFound()
    if (!['LOCKED', 'PAYING', 'COMPLETED'].includes(session.status)) {
        return <div className="text-center py-16 text-gray-500">Bill chưa sẵn sàng — phiên chưa được chốt.</div>
    }

    const isHost = user?.id === session.hostId

    // Get all participants with their orders
    const participants = await db
        .select({
            userId: sessionParticipants.userId,
            paymentStatus: sessionParticipants.paymentStatus,
            name: users.name,
            avatarUrl: users.avatarUrl,
            bankCode: users.bankCode,
            accountNumber: users.accountNumber,
            accountName: users.accountName,
        })
        .from(sessionParticipants)
        .innerJoin(users, eq(sessionParticipants.userId, users.id))
        .where(eq(sessionParticipants.sessionId, sessionId))

    // Calculate memberSubtotals from order_items
    const memberSummaries = await Promise.all(
        participants.map(async (p) => {
            const items = await db
                .select({ unitFinalPrice: orderItems.unitFinalPrice, quantity: orderItems.quantity })
                .from(orderItems)
                .where(and(eq(orderItems.sessionId, sessionId), eq(orderItems.userId, p.userId)))

            const memberSubtotal = items.reduce((sum, i) => sum + i.unitFinalPrice * i.quantity, 0)
            return { userId: p.userId, memberName: p.name, memberSubtotal }
        })
    )

    const extraFee = session.shipFee + session.serviceFee
    const billResult =
        session.splitMethod === 'EQUAL'
            ? calculateEqualSplit(memberSummaries, extraFee, session.grandTotal ?? undefined)
            : calculateByItemSplit(memberSummaries, extraFee, session.grandTotal ?? undefined)

    // Get host bank info
    const [hostUser] = await db.select().from(users).where(eq(users.id, session.hostId))

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Tổng kết Bill — {session.title}
            </h1>

            {/* Bill summary */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-6">
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div>
                        <p className="text-xs text-gray-400">Subtotal (tiền món)</p>
                        <p className="font-bold text-lg text-gray-900 dark:text-white">{billResult.subtotal.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Phí phát sinh</p>
                        <p className="font-bold text-lg text-gray-900 dark:text-white">{billResult.extraFee.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Tổng cần thanh toán</p>
                        <p className="font-bold text-xl text-green-600">{billResult.grandTotal.toLocaleString('vi-VN')}đ</p>
                    </div>
                </div>

                {/* Member bills table */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-400 text-xs">
                                <th className="pb-2 font-medium">Thành viên</th>
                                <th className="pb-2 font-medium text-right">Tiền món</th>
                                <th className="pb-2 font-medium text-right">Phải trả</th>
                                <th className="pb-2 font-medium text-right">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {billResult.memberBills.map((bill) => {
                                const participant = participants.find((p) => p.userId === bill.userId)
                                const payStatus = participant?.paymentStatus ?? 'PENDING'
                                const statusLabel = payStatus === 'PAID' ? '✅ Đã trả' : payStatus === 'SENT' ? '🔔 Đã chuyển' : '⏳ Chưa trả'

                                // VietQR for this member
                                const qrUrl =
                                    hostUser?.bankCode && hostUser?.accountNumber && hostUser?.accountName
                                        ? buildVietQRUrl({
                                            bankCode: hostUser.bankCode,
                                            accountNumber: hostUser.accountNumber,
                                            accountName: hostUser.accountName,
                                            amount: bill.amountToPay,
                                            sessionId: session.id,
                                            memberName: bill.memberName,
                                        })
                                        : null

                                return (
                                    <tr key={bill.userId} className="border-t border-gray-50 dark:border-gray-800">
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                {participant?.avatarUrl && (
                                                    <img src={participant.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
                                                )}
                                                <span className="font-medium text-gray-800 dark:text-gray-200">{bill.memberName}</span>
                                            </div>
                                            {bill.formula && (
                                                <p className="text-xs text-gray-400 mt-0.5">{bill.formula}</p>
                                            )}
                                        </td>
                                        <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                                            {bill.memberSubtotal.toLocaleString('vi-VN')}đ
                                        </td>
                                        <td className="py-3 text-right font-bold text-gray-900 dark:text-white">
                                            {bill.amountToPay.toLocaleString('vi-VN')}đ
                                        </td>
                                        <td className="py-3 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-xs">{statusLabel}</span>
                                                {/* QR code */}
                                                {qrUrl && payStatus !== 'PAID' && (
                                                    <details className="text-right">
                                                        <summary className="text-xs text-green-600 cursor-pointer hover:underline">Xem QR</summary>
                                                        <div className="mt-2">
                                                            <Image
                                                                src={qrUrl}
                                                                alt={`QR chuyển khoản cho ${bill.memberName}`}
                                                                width={150}
                                                                height={150}
                                                                className="rounded-lg border"
                                                            />
                                                        </div>
                                                    </details>
                                                )}
                                                {/* Self-declare transfer (for the current user) */}
                                                {user?.id === bill.userId && payStatus === 'PENDING' && (
                                                    <form action={markAsSentAction.bind(null, sessionId)}>
                                                        <button type="submit" className="text-xs text-blue-600 hover:underline">
                                                            Tôi đã chuyển
                                                        </button>
                                                    </form>
                                                )}
                                                {/* Host confirm payment */}
                                                {isHost && payStatus === 'SENT' && (
                                                    <form action={markAsPaidAction.bind(null, sessionId, bill.userId)}>
                                                        <button type="submit" className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded hover:bg-green-200">
                                                            Xác nhận nhận tiền
                                                        </button>
                                                    </form>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}

                            {/* Total row */}
                            <tr className="border-t-2 border-gray-200 dark:border-gray-700 font-bold">
                                <td className="py-3 text-gray-900 dark:text-white">Tổng</td>
                                <td className="py-3 text-right text-gray-700 dark:text-gray-300">
                                    {billResult.subtotal.toLocaleString('vi-VN')}đ (subtotal)
                                </td>
                                <td className="py-3 text-right text-green-600 text-lg">
                                    {billResult.grandTotal.toLocaleString('vi-VN')}đ
                                </td>
                                <td />
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Complete session button for host */}
            {isHost && session.status !== 'COMPLETED' && (
                <form action={completeSessionAction.bind(null, sessionId)}>
                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-green-500/20"
                    >
                        Kết thúc phiên
                    </button>
                </form>
            )}
        </div>
    )
}
