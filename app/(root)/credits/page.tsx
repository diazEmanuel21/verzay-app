import { currentUser } from '@/lib/auth';
import { AdminCreditPage, ResellerCreditPage } from './_components';
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

  return (
    <>
      {
        // isAssigned ? <ResellerCreditPage resellerInformation={resellerInformation.data} /> : < AdminCreditPage />
        <ResellerCreditPage resellerInformation={resellerInformation.data} />
      }
    </>
  )
}

export default MainCredits
