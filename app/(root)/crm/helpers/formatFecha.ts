
export function formatFecha(fecha?: Date) {
    if (!fecha) return "-";
    try {
        return fecha.toLocaleString("es-CO", {
            dateStyle: "short",
            timeStyle: "short",
        });
    } catch {
        return String(fecha);
    }
}