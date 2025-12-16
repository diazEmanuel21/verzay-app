import { RegistroWithSession } from "@/types/session";

export function getDisplayNombreFromRegistro(r: RegistroWithSession) {
    return (
        // r.session.cliente?.nombre ||
        r.nombre || // snapshot en Registro
        "Sin nombre"
    );
}
