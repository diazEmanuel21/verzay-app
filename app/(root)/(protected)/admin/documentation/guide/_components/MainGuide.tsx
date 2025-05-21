'use client'

import { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { deleteManual, createManual, updateManual, getManuals } from '@/actions/manual-actions'
import { z } from 'zod'
import { Textarea } from '@/components/ui/textarea'
import { User, Manual, Role } from '@prisma/client'
import { Edit2Icon, Search, Trash2 } from 'lucide-react'
interface MainGuideProps {
  user: User
}

type ManualClient = {
  id: string
  name: string
  description?: string | null
  url: string
}

const manualFormSchema = z.object({
  name: z.string().min(3, 'El nombre del manual es obligatorio.'),
  url: z.string().url('La URL del manual no es válida.'),
})

export function MainGuide({ user }: MainGuideProps) {
  const [manuals, setManuals] = useState<ManualClient[]>([])

  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  const [loading, setLoading] = useState(true);

  const [editData, setEditData] = useState<ManualClient | null>(null)
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', url: '' })

  const fetchManuals = async () => {
    setLoading(true)
    const res = await getManuals()
    if (res.success && Array.isArray(res.data)) {
      setManuals(res.data)
    } else {
      toast.error(res.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchManuals()
  }, [])

  const handleCreate = async () => {
    startTransition(async () => {
      const res = await createManual('userId', formData)
      if (res.success) {
        toast.success(res.message)
        setFormData({ name: '', description: '', url: '' })
        setOpen(false)
        fetchManuals()
      } else toast.error(res.message)
    })
  }

  const handleUpdate = async () => {
    startTransition(async () => {
      if (!editData) return;
      const res = await updateManual({
        id: editData.id,
        name: formData.name,
        description: formData.description,
        url: formData.url, // ⬅️ agregar esto
      })
      if (res.success) {
        toast.success(res.message)
        setEditData(null)
        setFormData({ name: '', description: '', url: '' })
        setOpen(false)
        fetchManuals()
      } else toast.error(res.message)
    })
  }


  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const res = await deleteManual(id)
      if (res.success) {
        toast.success(res.message)
        fetchManuals()
      } else toast.error(res.message)
    })
  }

  const openEdit = (manual: ManualClient) => {
    setEditData(manual)
    setFormData({ name: manual.name, description: manual.description || '', url: manual.url || '' })
    setOpen(true)
  }

  const filtered = manuals.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col p-4 gap-6 overflow-hidden">

      {/* Header y Filtro */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between overflow-hidden">
        <div className="flex flex-1 gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar manual..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {user.role === Role.admin &&
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditData(null) // ⬅️ importante
                    setFormData({ name: '', description: '', url: '' }) // ⬅️ limpio para crear
                  }}
                >
                  Nuevo manual
                </Button>
              </DialogTrigger>

              <DialogContent className="border-border">
                <DialogHeader>
                  <DialogTitle>{editData ? 'Editar Manual' : 'Crear Manual'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Nombre" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  <Textarea placeholder="Descripción" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  <Input placeholder="https://medias3.verzay.co/verzay-documentation/..." value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} />
                </div>
                <DialogFooter>
                  <Button onClick={editData ? handleUpdate : handleCreate} disabled={isPending}>
                    {isPending ? 'Guardando...' : editData ? 'Actualizar' : 'Crear'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        </div>
      </div>


      {/* Cards */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <p className="text-muted-foreground">Loading manual...</p>
        </div>
      ) : (
        <div className="flex-1">
          <div className="max-h-[70vh] overflow-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 min-w-[400px] p-2">
              {filtered.map((manual) => (
                <Card key={manual.id} className="relative border-border      
                    transition-all 
                    duration-300 
                    hover:shadow-lg 
                    hover:scale-[1.015] 
                    hover:border-primary">
                  <CardContent className="space-y-2 py-4">
                    <h3 className="text-lg font-semibold line-clamp-1">{manual.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{manual.description}</p>
                    <a href={manual.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 underline">
                      Ver Manual
                    </a>
                    {user.role === Role.admin &&
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEdit(manual)}>
                          <Edit2Icon />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(manual.id)}>
                          <Trash2 />
                        </Button>
                      </div>
                    }
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
