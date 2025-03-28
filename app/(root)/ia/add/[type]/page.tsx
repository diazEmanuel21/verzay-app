import React from 'react';
import { transformationTypes } from '@/constants';
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import FormSystemMessage from '@/components/form-system';

// Define un tipo literal que coincida con las claves de transformationTypes
type TransformationTypeKeys = keyof typeof transformationTypes;

interface SearchParamProps {
  params: {
    type: TransformationTypeKeys; // Usa el tipo literal aquí
  };
}

const AddIapage = async ({ params: { type } }: SearchParamProps) => {  
  const ia = transformationTypes[type];

  const session = await currentUser();

  const user = await db.user.findUnique({
    where: {email: session?.email ?? ""}
  });

  if (!user) {
    return <div>Not authenticated</div>;
  }

  return (
    <>
      <FormSystemMessage userId={user.id} />
    </>
  );
}

export default AddIapage;
