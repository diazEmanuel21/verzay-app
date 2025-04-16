import { currentUser } from '@/lib/auth';
import { AdminCreditPage, ResellerCreditPage } from './_components';
import { isUserAssignedToReseller } from '@/actions/reseller-action';
import { getResellerInformation } from '../../../actions/reseller-action';

const MainCredits = async () => {
  const user = await currentUser();

  if (!user) {
    return <h1 className="text-center text-2xl font-bold mt-10">404 - Usuario no autenticado</h1>;
  }

  const resellerInformation = await getResellerInformation(user.id);

  if (!resellerInformation) {
    return <h1 className="text-center text-2xl font-bold mt-10">404 - No se encontró información relacionada al reseller</h1>;
  }

  const isAssigned = await isUserAssignedToReseller(user.id);

  return (
    <>
      {
        isAssigned ? <ResellerCreditPage resellerInformation={resellerInformation.data} /> : < AdminCreditPage />
      }
    </>
  )
}

export default MainCredits
