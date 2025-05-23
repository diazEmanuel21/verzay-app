import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { MainDashboard } from "./_components/MainDashboard";
import { ConnectionMain } from "../../connection/_components";
import { Instancias } from "@prisma/client";
import { getInstancesByUserId } from "@/actions/instances-actions";

function hasInstancia(result: { data?: Instancias | null }): result is { data: Instancias } {
  return !!result.data
};

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  const resInstancia = await getInstancesByUserId(user.id);
  const instance = resInstancia.success && hasInstancia(resInstancia) ? resInstancia.data : undefined;

  return (
    <>
      <ConnectionMain user={user} instance={instance} />
      <MainDashboard user={user} />
    </>
  );
}
