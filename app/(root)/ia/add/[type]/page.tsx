import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import FormSystemMessage from '@/components/form-system';

interface PageProps {
  params: { id?: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

const AddIapage = async ({ params, searchParams }: PageProps) => {
  const user = await currentUser();

  if (!user) {
    redirect('/login');
  };

  return (
      <FormSystemMessage 
        userId={user.id} 
        // additionalParams={searchParams} 
      />
  );
};

export default AddIapage;