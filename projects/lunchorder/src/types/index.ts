// Shared TypeScript types / enums for LunchOrder

export type SessionStatus = 'VOTING' | 'ORDERING' | 'LOCKED' | 'PAYING' | 'COMPLETED' | 'CANCELLED'
export type SplitMethod = 'EQUAL' | 'BY_ITEM'
export type PaymentStatus = 'PENDING' | 'SENT' | 'PAID'
export type UserRole = 'admin' | 'member'

export interface ActionResult<T = null> {
    success: boolean
    data?: T
    error?: string | Record<string, string[]>
}

export interface VietQRParams {
    bankCode: string
    accountNumber: string
    accountName: string
    amount: number
    sessionId: string
    memberName: string
}

// Session status display config
export const SESSION_STATUS_CONFIG: Record<
    SessionStatus,
    { label: string; color: string; description: string }
> = {
    VOTING: { label: 'Đang Vote', color: 'blue', description: 'Thành viên đang vote nhà hàng' },
    ORDERING: { label: 'Đang Order', color: 'green', description: 'Thành viên đang chọn món' },
    LOCKED: { label: 'Đã Chốt', color: 'orange', description: 'Đơn đã được chốt' },
    PAYING: { label: 'Đang Thanh Toán', color: 'yellow', description: 'Đang thu tiền' },
    COMPLETED: { label: 'Hoàn Thành', color: 'gray', description: 'Phiên đã kết thúc' },
    CANCELLED: { label: 'Đã Hủy', color: 'red', description: 'Phiên bị hủy' },
}
