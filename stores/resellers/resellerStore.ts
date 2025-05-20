'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { ResellerData } from '@/schema/reseller'

interface ResellerStore {
    reseller: ResellerData | null
    isLoaded: boolean
    setReseller: (data: ResellerData) => void
    clearReseller: () => void
}

export const useResellerStore = create<ResellerStore>()(
    devtools(
        (set) => ({
            reseller: null,
            isLoaded: false,

            setReseller: (data) =>
                set(
                    { reseller: data, isLoaded: true },
                    false,
                    'reseller/set'
                ),

            clearReseller: () =>
                set(
                    { reseller: null, isLoaded: true },
                    false,
                    'reseller/clear'
                ),
        }),
        { name: 'Reseller Store' }
    )
)
