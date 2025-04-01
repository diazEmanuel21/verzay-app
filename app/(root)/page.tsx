import { WorkWithUs, LeadsChart } from "@/components/custom"

const Home = async ({ searchParams }: SearchParamProps) => {

  return (
    <>
      <LeadsChart />
      <div className="pb-5">
        <WorkWithUs />
      </div>
    </>
  )
}

export default Home