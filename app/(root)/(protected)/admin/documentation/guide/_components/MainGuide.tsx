'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Trash2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { User } from '@prisma/client'

interface Guide {
  id: number
  name: string
  file: File
}

interface MainGuideProps {
  user: User
}

export function MainGuide({ user }: MainGuideProps) {
  const [guides, setGuides] = useState<Guide[]>([])
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      const newGuide = {
        id: Date.now(),
        name: file.name,
        file,
      }
      setGuides((prev) => [...prev, newGuide])
      toast.success('Manual cargado correctamente')
    } else {
      toast.error('Solo se permiten archivos PDF')
    }
  }

  const handleDelete = (id: number) => {
    setGuides((prev) => prev.filter((guide) => guide.id !== id))
    toast.success('Manual eliminado')
  }

  const handleEdit = (id: number, newName: string) => {
    setGuides((prev) =>
      prev.map((guide) =>
        guide.id === id ? { ...guide, name: newName } : guide
      )
    )
    toast.success('Nombre del manual actualizado')
  }

  return (
    <section className="p-4 sm:p-6">
      <h2 className="text-2xl font-semibold mb-4 text-blue-800">Manuales del Usuario</h2>

      {user.role === 'admin' && (
        <div className="mb-6 flex items-center gap-4">
          <Input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Upload className="w-4 h-4 mr-2" /> Cargar Manual
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {guides.map((guide) => (
          <Card key={guide.id} className="bg-blue-50 border border-blue-200">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="text-blue-900 font-medium truncate">
                  <FileText className="inline mr-2 text-blue-500" />
                  {guide.name}
                </div>
                {user.role === 'admin' && (
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" className="text-blue-600 hover:text-blue-800">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar nombre del manual</DialogTitle>
                        </DialogHeader>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            const formData = new FormData(e.currentTarget)
                            const newName = formData.get('name') as string
                            handleEdit(guide.id, newName)
                          }}
                          className="space-y-4"
                        >
                          <Input
                            name="name"
                            defaultValue={guide.name}
                            className="text-blue-800"
                          />
                          <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
                            Guardar cambios
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleDelete(guide.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              <a
                href={URL.createObjectURL(guide.file)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Ver manual
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}