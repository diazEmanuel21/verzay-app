'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  FileText,
  FileSpreadsheet,
  Folder
} from 'lucide-react'

const tools = [
  {
    id: 'drive',
    label: 'Google Drive',
    icon: <Folder className="w-10 h-10 text-blue-600" />,
  },
  {
    id: 'docs',
    label: 'Google Docs',
    icon: <FileText className="w-10 h-10 text-blue-500" />,
  },
  {
    id: 'sheets',
    label: 'Google Sheets',
    icon: <FileSpreadsheet className="w-10 h-10 text-green-600" />,
  },
]

export default function HerramientasClientePage() {
  const { id } = useParams()
  const router = useRouter()

  const [selectedTools, setSelectedTools] = useState<string[]>([])

  const toggleTool = (toolId: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId]
    )
  }

  const handleSave = () => {
    toast.success('Herramientas guardadas')
    router.push('/admin/clientes')
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Asignar Herramientas</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Card
            key={tool.id}
            onClick={() => toggleTool(tool.id)}
            className={`cursor-pointer transition border-2 ${
              selectedTools.includes(tool.id)
                ? 'border-blue-600 shadow-md'
                : 'border-transparent hover:border-gray-300'
            }`}
          >
            <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
              {tool.icon}
              <Label className="text-center text-sm">{tool.label}</Label>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={selectedTools.length === 0}>
          Guardar herramientas
        </Button>
      </div>
    </div>
  )
}