import React from 'react'

import { transformationTypes } from '@/constants';
import Header from '@/components/shared/header';
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type TransformationTypeKeys = keyof typeof transformationTypes;

interface SearchParamProps {
  params: {
    type: TransformationTypeKeys; // Usa el tipo literal aquí
  };
}

import { getTools } from "@/actions/tools-action";


const tools = async ({ params: { type } }: SearchParamProps) => {

  const me = transformationTypes[type];

  const session = await currentUser();

  const user = await db.user.findUnique({
    where: { email: session?.email ?? "" }
  });

  if (!user) {
    return <div>Not authenticated</div>;
  }

  const tools = await getTools(user.id);

  return (
    <>
      <Header
        title={'Herramientas'}
        subtitle={'Crea tus herramientas de automatización'}
      />

      <div className='max-w-screen-lg mx-auto'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-2'>
          {tools ? (
            tools.map((tool) => (
              <Card key={tool.id}>
                <CardHeader>
                  <CardTitle>
                    {tool.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{tool.description}</p>
                  {/* <span className='text-slate-600'>
                  {new Date(tool.createdAt).toLocaleDateString()}
                </span> */}
                </CardContent>
                <CardFooter className='flex gap-x-2 justify-end'>
                  <Button variant={"destructive"}>
                    Eliminar
                  </Button>
                  <Button>
                    Editar
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div>No tools found</div>
          )}

          {/* <Card>
          <Link href="/tools/add/new">
          <div className='flex justify-center items-center h-full'>
            <CardContent>

            <CardTitle className='pb-4'>Crea tus herramientas</CardTitle>
            <div className='flex justify-center'><Button>
              +
            </Button></div>
            </CardContent>
            
          </div>
          </Link>
        </Card> */}
          <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition">
            <CardHeader className="flex flex-col items-center text-center">
              {/* Icono de Google Sheets */}
              <div className="w-16 h-16 mb-4">
                <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#34A853" d="M6 42V6a2 2 0 012-2h20l14 14v24a2 2 0 01-2 2H8a2 2 0 01-2-2z" />
                  <path fill="#FFF" d="M20 6v12h12" />
                  <path fill="#FFF" d="M14 24h20v2H14zm0 6h20v2H14zm0 6h14v2H14z" />
                </svg>
              </div>
              <CardTitle className="text-xl font-bold mt-2">CRM de Google Sheets</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Gestiona tus clientes y ventas directamente desde Google Sheets de forma simple y eficiente.
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium">
                Acceder al CRM
              </Button>
            </CardContent>
          </Card>

          <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition">
            <CardHeader className="flex flex-col items-center text-center">
              <div className="w-16 h-16 mb-4">
                <img
                  src="https://www.gstatic.com/images/branding/product/1x/drive_48dp.png"
                  alt="Google Drive Icon"
                  className="w-full h-full object-contain"
                />
              </div>
              <CardTitle className="text-xl font-bold mt-2">Recursos Compartidos</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Agrega los documentos, plantillas y recursos importantes desde nuestro Google Drive.
              </p>
              <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium">
                Ver Archivos
              </Button>
            </CardContent>
          </Card>

          <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition">
            <CardHeader className="flex flex-col items-center text-center">
              {/* Imagen de Google Docs */}
              <div className="w-16 h-16 mb-4">
                <img
                  src="https://www.gstatic.com/images/branding/product/1x/docs_48dp.png"
                  alt="Google Docs Icon"
                  className="w-full h-full object-contain"
                />
              </div>
              <CardTitle className="text-xl font-bold mt-2">Preguntas Frecuentes</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Agrega las respuestas, preguntas más frecuentes en nuestro doc de Google Docs.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
                Ver Documento
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  )
}

export default tools
