'use client'

import { useState, useRef } from 'react'
import { TYPE_AI_LABELS } from '@/schema/ai'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export const AiTabs = ({
    onTabChange,
}: {
    onTabChange?: (tab: string) => void
}) => {
    const [activeTab, setActiveTab] = useState<string>(Object.keys(TYPE_AI_LABELS)[0])
    const scrollRef = useRef<HTMLDivElement>(null)

    const handleTabClick = (key: string) => {
        setActiveTab(key)
        onTabChange?.(key)
    }

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return
        const scrollAmount = 150
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        })
    }

    return (
        <div className="w-full">
            {/* Controles móviles */}
            <div className="flex justify-between">
                <Button variant="ghost" size="icon" onClick={() => scroll('left')} className=" sm:hidden">
                    <ArrowLeft />
                </Button>

                <div
                    ref={scrollRef}
                    className={cn(
                        'flex overflow-x-auto gap-2 pb-1 scrollbar-none',
                        'sm:overflow-visible sm:justify-start sm:flex-wrap'
                    )}
                >
                    {Object.entries(TYPE_AI_LABELS).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => handleTabClick(key)}
                            className={cn(
                                'px-4 py-2 rounded-t-md font-medium text-sm border-b-2 transition-colors duration-150 whitespace-nowrap',
                                activeTab === key
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground'
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <Button variant="ghost" size="icon" onClick={() => scroll('right')} className=" sm:hidden">
                    <ArrowRight />
                </Button>
            </div>
        </div>
    )
}