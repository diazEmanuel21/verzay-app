import { redirect } from 'next/navigation';
import { UserInformation } from '@/components/UserInformation';
import { currentUser } from '@/lib/auth';
import { getCountryCodes } from '@/actions/get-country-action';

const ProfilePage = async () => {
  const user = await currentUser();

  if (!user) {
    redirect('/login');
  };

  const countries = await getCountryCodes()

  return (
    <>
      <UserInformation userId={user.id} countries={countries}/>
    </>
  );
}

export default ProfilePage;