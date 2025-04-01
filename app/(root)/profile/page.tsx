import { redirect } from 'next/navigation';
import { UserInformation } from '@/components/UserInformation';
import { currentUser } from '@/lib/auth';

const ProfilePage = async() => {
  const user = await currentUser();
  
  if (!user) {
    redirect('/login');
  };

  return (
    <>
      <UserInformation userId={user.id} />
    </>
  );
}

export default ProfilePage;