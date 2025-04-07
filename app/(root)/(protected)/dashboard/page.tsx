import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { MainDashboard } from "./_components/MainDashboard";


export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <MainDashboard user={user} />
  );
}
