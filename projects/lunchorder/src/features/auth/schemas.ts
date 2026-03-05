import { z } from 'zod'

export const updateBankInfoSchema = z.object({
    bankCode: z.string().min(2, 'Mã ngân hàng không hợp lệ').max(10).toUpperCase(),
    accountNumber: z.string().min(6, 'Số tài khoản không hợp lệ').max(20),
    accountName: z.string().min(1, 'Tên chủ tài khoản là bắt buộc').max(100).toUpperCase(),
})

export type UpdateBankInfoInput = z.infer<typeof updateBankInfoSchema>
