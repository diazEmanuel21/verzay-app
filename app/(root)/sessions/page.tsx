
import Header from "@/components/shared/header";
import { currentUser } from "@/lib/auth"; // Ahora SÍ aquí
import { redirect } from 'next/navigation';
import { SessionsContent } from "./_components/sessions-content";

export default async function SessionsPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/login');
  };

  return (
    <>

      <div>
        <SessionsContent userId={user.id} ></SessionsContent>
      </div>

    </>
  );
}
