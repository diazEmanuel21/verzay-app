// stores/useResellerStore.ts
'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { ResellerData } from '@/schema/reseller'

interface ResellerStore {
    reseller: ResellerData | null
    setReseller: (data: ResellerData) => void
    clearReseller: () => void
}

export const useResellerStore = create<ResellerStore>()(
    devtools(
        (set) => ({
            reseller: null,
            setReseller: (data) => set({ reseller: data }, false, 'reseller/set'),
            clearReseller: () => set({ reseller: null }, false, 'reseller/clear'),
        }),
        { name: 'Reseller Store' }
    )
)