import { transformationTypes } from '@/constants';
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { UserInformation } from '@/components/UserInformation';

// Define un tipo literal que coincida con las claves de transformationTypes
type TransformationTypeKeys = keyof typeof transformationTypes;

interface SearchParamProps {
  params: {
    type: TransformationTypeKeys; // Usa el tipo literal aquí
  };
}

const ProfilePage = async ({ params: { type } }: SearchParamProps) => {  
  const session = await currentUser();

  const user = await db.user.findUnique({
    where: {email: session?.email ?? ""}
  });

  if (!user) {
    return <div>Not authenticated</div>;
  }

  return (
    <>
      <UserInformation userId={user.id} />
    </>
  );
}

export default ProfilePage;
