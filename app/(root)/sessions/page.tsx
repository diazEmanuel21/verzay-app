// app/sessions/page.tsx (Server Component)
import { getSessionsByUserId } from "@/actions/session-action";
import { MainSession } from "./_components";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

export default async function SessionsPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/login');
  }

  const result = await getSessionsByUserId(user.id);

  if (!result.data) {
    return <h1>Error cargando sesiones</h1>;
  }

  return <MainSession sessions={result.data} />;
}