import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table } from '@tanstack/react-table'

interface Props<TData> {
    table: Table<TData>
}

export function ColumnFilterInput<TData>({ table }: Props<TData>) {
    const [selectedColumn, setSelectedColumn] = useState<'email' | 'name' | 'company'>('email')
    const [value, setValue] = useState<string>('')

    const handleFilter = (val: string, column: string) => {
        table.getAllColumns().forEach((col) => {
            if (col.id !== column) col.setFilterValue(undefined)
        })

        table.getColumn(column)?.setFilterValue(val)
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
            {/* Select */}
            <Select
                value={selectedColumn}
                onValueChange={(val: 'email' | 'name' | 'company') => {
                    setSelectedColumn(val)
                    setValue('')
                    handleFilter('', val)
                }}
            >
                <SelectTrigger className="w-full sm:max-w-[180px]">
                    <SelectValue placeholder="Filtrar por..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="email">Correo</SelectItem>
                    <SelectItem value="name">Nombre</SelectItem>
                    <SelectItem value="company">Marca</SelectItem>
                </SelectContent>
            </Select>

            {/* Input */}
            <Input
                placeholder={`Buscar por ${selectedColumn}...`}
                value={value}
                onChange={(e) => {
                    const val = e.target.value
                    setValue(val)
                    handleFilter(val, selectedColumn)
                }}
                className="flex-1"
            />
        </div>
    )
}
