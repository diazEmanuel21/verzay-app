'use server'

export interface Country {
    name: string
    code: string
    flag: string
}

export const getCountryCodes = async () => {
    try {
        const res = await fetch('https://restcountries.com/v3.1/region/americas?fields=name,idd,flags', {
            next: { revalidate: 60 * 60 } // caché por 1 hora (opcional)
        })

        if (!res.ok) {
            throw new Error('Error al obtener países')
        }

        const data = await res.json()

        const countries = data
            .map((country: any) => {
                const root = country?.idd?.root
                const suffix = country?.idd?.suffixes?.[0] || ''
                const code = root ? `${root}${suffix}` : null

                return code
                    ? {
                        name: country.name.common,
                        code,
                        flag: country.flags?.svg || '',
                    }
                    : null
            })
            .filter(Boolean)
            .sort((a: Country, b: Country) => a.name.localeCompare(b.name))

        return countries
    } catch (error) {
        console.error('[getCountryCodes]', error)
        return []
    }
}