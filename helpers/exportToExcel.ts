
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

// ...

export const exportToExcel = () => {
    const table = document.querySelector("table") // O usa un selector más específico si hay varias tablas
    if (!table) {
        toast.error("No se encontró la tabla para exportar.")
        return
    }

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.table_to_sheet(table)
    XLSX.utils.book_append_sheet(wb, ws, "Clientes")
    XLSX.writeFile(wb, "clientes.xlsx")
}