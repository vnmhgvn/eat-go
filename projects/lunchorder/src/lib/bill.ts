// Pure bill calculation functions — no side effects, fully testable
// All amounts in VNĐ (integer)

export interface MemberOrderSummary {
    userId: string
    memberName: string
    memberSubtotal: number // Σ unitFinalPrice × quantity for this member
}

export interface MemberBill {
    userId: string
    memberName: string
    memberSubtotal: number
    amountToPay: number // Final amount this member owes
    formula?: string // Human-readable formula string for UI
}

export interface BillResult {
    subtotal: number
    extraFee: number
    grandTotal: number
    memberBills: MemberBill[]
}

/**
 * Chia đều (EQUAL): Each member pays grandTotal / numberOfMembers
 * Rounding remainder goes to the member with the largest memberSubtotal
 */
export function calculateEqualSplit(
    members: MemberOrderSummary[],
    extraFee: number,
    overrideGrandTotal?: number
): BillResult {
    const subtotal = members.reduce((sum, m) => sum + m.memberSubtotal, 0)
    const grandTotal = overrideGrandTotal ?? subtotal + extraFee
    const count = members.length

    if (count === 0) return { subtotal, extraFee, grandTotal, memberBills: [] }

    const baseAmount = Math.floor(grandTotal / count)
    const remainder = grandTotal - baseAmount * count

    // Sort by memberSubtotal descending — largest pays the remainder
    const sorted = [...members].sort((a, b) => b.memberSubtotal - a.memberSubtotal)

    const memberBills: MemberBill[] = sorted.map((m, idx) => ({
        userId: m.userId,
        memberName: m.memberName,
        memberSubtotal: m.memberSubtotal,
        amountToPay: idx === 0 ? baseAmount + remainder : baseAmount,
    }))

    return { subtotal, extraFee, grandTotal, memberBills }
}

/**
 * Chia theo món (BY_ITEM): amountToPay_X = memberSubtotal_X × grandTotal / subtotal
 * Rounding adjustment: difference goes to member with largest memberSubtotal
 *
 * BR04: Ship/service fee is NOT part of the ratio calculation — it's absorbed
 * naturally via the grandTotal override.
 * T03: Σ amountToPay must equal grandTotal exactly.
 */
export function calculateByItemSplit(
    members: MemberOrderSummary[],
    extraFee: number,
    overrideGrandTotal?: number
): BillResult {
    const subtotal = members.reduce((sum, m) => sum + m.memberSubtotal, 0)
    const grandTotal = overrideGrandTotal ?? subtotal + extraFee

    if (subtotal === 0) {
        // Edge case: no one ordered anything — split equally
        return calculateEqualSplit(members, extraFee, overrideGrandTotal)
    }

    // Compute raw (possibly fractional) amounts
    const rawBills = members.map((m) => ({
        ...m,
        rawAmount: (m.memberSubtotal * grandTotal) / subtotal,
    }))

    // Floor all amounts
    let flooredBills = rawBills.map((m) => ({
        userId: m.userId,
        memberName: m.memberName,
        memberSubtotal: m.memberSubtotal,
        amountToPay: Math.floor(m.rawAmount),
        formula: `${m.memberSubtotal.toLocaleString('vi-VN')} × ${grandTotal.toLocaleString('vi-VN')} ÷ ${subtotal.toLocaleString('vi-VN')} = ${Math.floor(m.rawAmount).toLocaleString('vi-VN')}đ`,
    }))

    // Calculate remainder to distribute
    const sumFloored = flooredBills.reduce((s, m) => s + m.amountToPay, 0)
    const remainder = grandTotal - sumFloored

    if (remainder !== 0) {
        // Add remainder to member with largest memberSubtotal (T03)
        const sorted = [...flooredBills].sort((a, b) => b.memberSubtotal - a.memberSubtotal)
        sorted[0].amountToPay += remainder

        return { subtotal, extraFee, grandTotal, memberBills: sorted }
    }

    return { subtotal, extraFee, grandTotal, memberBills: flooredBills }
}
