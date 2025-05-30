'use client'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import Image from 'next/image'

interface CountryCodeSelectProps {
    countries: { name: string; code: string; flag: string }[]
    onChange?: (value: string) => void
    defaultValue?: string
}

export const CountryCodeSelect: React.FC<CountryCodeSelectProps> = ({
    countries,
    onChange,
    defaultValue
}) => {
    return (
        <Select onValueChange={onChange} defaultValue={defaultValue}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un país" />
            </SelectTrigger>
            <SelectContent>
                {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                        <div className="flex items-center gap-2">
                            {country.flag && (
                                <Image
                                    src={country.flag}
                                    alt={country.name}
                                    width={20}
                                    height={15}
                                    className="rounded-sm"
                                />
                            )}
                            {country.name} ({country.code})
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
