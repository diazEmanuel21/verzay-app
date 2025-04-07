import { WorkWithUs, LeadsChart } from "@/components/custom"
import { MainDashboard } from "./(protected)/dashboard/_components/MainDashboard"
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

const Home = async ({ searchParams }: SearchParamProps) => {

  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      {/* <LeadsChart /> */}
      {/* <WorkWithUs /> */}
      <MainDashboard user={user} />
    </>
  )
}

export default Home