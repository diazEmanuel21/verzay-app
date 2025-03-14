import React from 'react';
import { transformationTypes } from '@/constants';
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

import Header from '@/components/shared/header';
import IaForm from '@/components/shared/iaForm';
import OpenAICredentialManager from '@/components/form-credia';
import CreateBotComponent from '@/components/form-botia';
import FormSystemMessage from '@/components/form-system';
import EnableToggleButton from '@/components/button-bot';

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
      {/* <Header 
        title={'Entrena tu IA'}
        subtitle={'Agrega y personaliza las instrucciones para tu IA.'}
      /> */}

      <FormSystemMessage userId={user.id} />
      


      {/* <OpenAICredentialManager userId={user.id} />
      <CreateBotComponent userId={user.id} /> */}
      
    </>
  );
}

export default AddIapage;
