'use client'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/stores'
import { Label } from '../ui/label'

export function BrandSelector() {
    const setTheme = useThemeStore((s) => s.setTheme)

    return (
        <>
            <Label>Theme selector</Label>
            <div className="flex gap-2 flex-col">
                <Button onClick={() => setTheme('verzay')}>Verzay</Button>
                <Button onClick={() => setTheme('aizen bots')}>Aizen Bots</Button>
                <Button onClick={() => setTheme('wat bot')}>Wat Bot</Button>
            </div>
        </>
    )
}
