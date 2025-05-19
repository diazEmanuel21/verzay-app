'use client'

import { useThemeStore } from '@/stores'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { ThemeApp } from '@prisma/client'
import { themes } from '@/schema/theme'

export function BrandSelector() {
    const { current, setTheme } = useThemeStore()

    return (
        <Select value={current} onValueChange={(value) => setTheme(value as ThemeApp)}>
            <SelectTrigger>
                <SelectValue placeholder="Selecciona un tema" />
            </SelectTrigger>
            <SelectContent>
                {Object.entries(themes).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                            <span
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: `hsl(${value['--primary']})` }}
                            />
                            {key}
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
