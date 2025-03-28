import { currentUser } from "@/lib/auth"; // ajusta esta ruta según tu proyecto
import { getSessionsByUserId } from "@/actions/session-action";
import { Session } from "@prisma/client";
import { MainSession } from "./_components";

function hasSessions(result: { data?: Session[] }): result is { data: Session[] } {
  return !!result.data;
}

export default async function SessionsPage() {
  const session = await currentUser();

  if (!session) {
    return <h1>No autorizado</h1>;
  }

  const result = await getSessionsByUserId(session.id);

  return hasSessions(result) 
    ? <MainSession sessions={result.data} /> 
    : <h1>Error cargando sesiones</h1>;
}
