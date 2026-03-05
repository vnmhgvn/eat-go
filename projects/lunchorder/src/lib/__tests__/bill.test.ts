import { describe, it, expect } from 'vitest'
import { calculateEqualSplit, calculateByItemSplit } from '../bill'
import { buildVietQRUrl } from '../../features/payment/utils/viet-qr'

const members = [
    { userId: 'a', memberName: 'An', memberSubtotal: 120_000 },
    { userId: 'b', memberName: 'Bình', memberSubtotal: 90_000 },
    { userId: 'c', memberName: 'Chi', memberSubtotal: 140_000 },
]

describe('calculateEqualSplit', () => {
    it('divides grandTotal evenly among members', () => {
        const m = [
            { userId: '1', memberName: 'A', memberSubtotal: 100_000 },
            { userId: '2', memberName: 'B', memberSubtotal: 80_000 },
            { userId: '3', memberName: 'C', memberSubtotal: 120_000 },
            { userId: '4', memberName: 'D', memberSubtotal: 80_000 },
        ]
        const result = calculateEqualSplit(m, 0, 380_000)
        expect(result.memberBills.every((b) => b.amountToPay === 95_000)).toBe(true)
        expect(result.grandTotal).toBe(380_000)
    })

    it('rounding remainder goes to member with largest subtotal', () => {
        const m = [
            { userId: '1', memberName: 'A', memberSubtotal: 200_000 },
            { userId: '2', memberName: 'B', memberSubtotal: 100_000 },
            { userId: '3', memberName: 'C', memberSubtotal: 100_000 },
        ]
        const result = calculateEqualSplit(m, 0, 100_001)
        const total = result.memberBills.reduce((s, b) => s + b.amountToPay, 0)
        expect(total).toBe(100_001)
        const billA = result.memberBills.find((b) => b.userId === '1')
        // floor(100001/3) = 33333, 3×33333 = 99999, remainder = 2 → A (largest subtotal) gets 33333+2 = 33335
        expect(billA?.amountToPay).toBe(33_335)
    })

    it('sum always equals grandTotal for arbitrary totals', () => {
        for (const grandTotal of [100_001, 333_333, 1_000_000, 99]) {
            const result = calculateEqualSplit(members, 0, grandTotal)
            const total = result.memberBills.reduce((s, b) => s + b.amountToPay, 0)
            expect(total).toBe(grandTotal)
        }
    })
})

describe('calculateByItemSplit', () => {
    it('BRD example: A:120k, B:90k, C:140k, grandTotal:330k — sum = 330k', () => {
        const result = calculateByItemSplit(members, 0, 330_000)
        const total = result.memberBills.reduce((s, b) => s + b.amountToPay, 0)
        expect(total).toBe(330_000)
        const billA = result.memberBills.find((b) => b.userId === 'a')!
        const billB = result.memberBills.find((b) => b.userId === 'b')!
        expect(Math.abs(billA.amountToPay - 113_143)).toBeLessThanOrEqual(1)
        expect(Math.abs(billB.amountToPay - 84_857)).toBeLessThanOrEqual(1)
    })

    it('sum always equals grandTotal for arbitrary totals', () => {
        for (const grandTotal of [100_001, 350_000, 999_999, 200]) {
            const result = calculateByItemSplit(members, 0, grandTotal)
            const total = result.memberBills.reduce((s, b) => s + b.amountToPay, 0)
            expect(total).toBe(grandTotal)
        }
    })

    it('falls back to equal split when all member subtotals are 0', () => {
        const emptyMembers = [
            { userId: '1', memberName: 'A', memberSubtotal: 0 },
            { userId: '2', memberName: 'B', memberSubtotal: 0 },
        ]
        const result = calculateByItemSplit(emptyMembers, 0, 100_000)
        const total = result.memberBills.reduce((s, b) => s + b.amountToPay, 0)
        expect(total).toBe(100_000)
    })

    it('includes extraFee in grandTotal when no override', () => {
        const result = calculateByItemSplit(members, 30_000)
        expect(result.grandTotal).toBe(380_000)
        const total = result.memberBills.reduce((s, b) => s + b.amountToPay, 0)
        expect(total).toBe(380_000)
    })
})

describe('buildVietQRUrl', () => {
    it('builds correct VietQR URL with encoded content', () => {
        const url = buildVietQRUrl({
            bankCode: 'VCB',
            accountNumber: '0123456789',
            accountName: 'NGUYEN VAN A',
            amount: 113_143,
            sessionId: 'abc12345-0000-0000-0000-000000000000',
            memberName: 'Nguyen Van A',
        })
        expect(url).toContain('img.vietqr.io/image/VCB-0123456789-compact2.png')
        expect(url).toContain('amount=113143')
        expect(url).toContain('LUNCHORDER')
        expect(url).toContain('ABC12345')
    })

    it('encodes special chars — no raw spaces in the query string', () => {
        const url = buildVietQRUrl({
            bankCode: 'VCB',
            accountNumber: '123',
            accountName: 'TEST',
            amount: 10_000,
            sessionId: 'ffffffff-0000-0000-0000-000000000000',
            memberName: 'Trần Thị B',
        })
        // URLSearchParams encodes spaces as +
        const queryPart = url.split('?')[1]
        expect(queryPart).not.toMatch(/ /)
    })
})
