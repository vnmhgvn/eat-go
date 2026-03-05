import type { VietQRParams } from '@/types'

/**
 * Build a VietQR URL for client-side QR code display.
 * No API key required — uses the public img.vietqr.io endpoint.
 * T05: sessionId is the FULL UUID; we take first 8 chars for the transfer note.
 */
export function buildVietQRUrl({
    bankCode,
    accountNumber,
    accountName,
    amount,
    sessionId,
    memberName,
}: VietQRParams): string {
    const sessionShort = sessionId.replace(/-/g, '').slice(0, 8).toUpperCase()
    const addInfo = `LUNCHORDER ${sessionShort} ${memberName}`

    const params = new URLSearchParams({
        amount: String(amount),
        addInfo: addInfo,
        accountName: accountName,
    })

    return `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?${params.toString()}`
}
