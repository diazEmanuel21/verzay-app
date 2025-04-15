import { currentUser } from '@/lib/auth';
import { AdminCreditPage, ResellerCreditPage } from './_components';
import { isUserAssignedToReseller } from '@/actions/reseller-action';

const MainCredits = async () => {
  const user = await currentUser();

  if (!user) {
    return <h1 className="text-center text-2xl font-bold mt-10">404 - Usuario no autenticado</h1>;
  }

  const isAssigned = await isUserAssignedToReseller(user.id)
  debugger;

  return (
    <>
      {
        isAssigned ? <ResellerCreditPage /> : < AdminCreditPage />
      }
    </>
  )
}

export default MainCredits
