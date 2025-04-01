import { transformationTypes } from '@/constants';
import Header from '@/components/shared/header';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';


type TransformationTypeKeys = keyof typeof transformationTypes;

interface SearchParamProps {
  params: {
    type: TransformationTypeKeys; // Usa el tipo literal aquí
  };
}

const herramientas = async ({ params: { type } }: SearchParamProps) => {
  const user = await currentUser();

  if (!user) {
    redirect('/login');
  };

  return (
    <>
      <Header
        title={'Herramientas'}
        subtitle={'Crea tus herramientas de automatización'}
      />
    </>
  )
}

export default herramientas
