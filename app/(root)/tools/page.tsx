import { transformationTypes } from '@/constants'
import Header from '@/components/shared/header'
import { currentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import Link from 'next/link'

import { getTools } from "@/actions/tools-action"
import { redirect } from 'next/navigation'

type TransformationTypeKeys = keyof typeof transformationTypes

interface SearchParamProps {
  params: {
    type: TransformationTypeKeys
  }
};

const ToolsPage = async ({ params: { type } }: SearchParamProps) => {
  const user = await currentUser();

  if (!user) {
    redirect('/login')
  };

  const toolResponse = await getTools(user.id)

  const toolsMap: Record<string, string> = {}

  if (toolResponse.success && toolResponse.data) {
    for (const tool of toolResponse.data) {
      toolsMap[tool.name] = tool.description || ''
    }
  }

  return (
    <>
      <Header
        title={'Herramientas'}
        subtitle={'Crea tus herramientas de automatización'}
      />

      <div className='max-w-screen-lg mx-auto'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-2'>

          {/* GOOGLE SHEETS */}
          <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-2xl border p-6 hover:shadow-xl transition">
            <CardHeader className="flex flex-col items-center text-center">
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
                Gestiona tus clientes solicitudes, ventas y mas directamente desde CRM Google Sheet.
              </p>
              {toolsMap.sheets ? (
                <Link href={toolsMap.sheets} target="_blank">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium">
                    Acceder al CRM
                  </Button>
                </Link>
              ) : (
                <Button disabled className="w-full">
                  Enlace no disponible
                </Button>
              )}
            </CardContent>
          </Card>

          {/* GOOGLE DRIVE */}
          <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-2xl border p-6 hover:shadow-xl transition">
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
              {toolsMap.drive ? (
                <Link href={toolsMap.drive} target="_blank">
                  <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium">
                    Ver Archivos
                  </Button>
                </Link>
              ) : (
                <Button disabled className="w-full">
                  Enlace no disponible
                </Button>
              )}
            </CardContent>
          </Card>

          {/* GOOGLE DOCS */}
          <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-2xl border p-6 hover:shadow-xl transition">
            <CardHeader className="flex flex-col items-center text-center">
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
                Agrega las preguntas y respuestas frecuentes en nuestro documento de Google Docs.
              </p>
              {toolsMap.docs ? (
                <Link href={toolsMap.docs} target="_blank">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
                    Ver Documento
                  </Button>
                </Link>
              ) : (
                <Button disabled className="w-full">
                  Enlace no disponible
                </Button>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  )
}

export default ToolsPage