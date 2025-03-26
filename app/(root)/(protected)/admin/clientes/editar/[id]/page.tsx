'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateClientData } from '@/actions/userClientDataActions'

type User = {
  id: string
  name: string
  email: string
}

export default function EditarClientePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulación de fetch, reemplaza por una llamada real si tienes API
    const fetchUser = async () => {
      const res = await fetch(`/api/clientes/${userId}`)
      const data = await res.json()
      setUser(data)
      setLoading(false)
    }

    fetchUser()
  }, [userId])

  const handleSubmit = async (formData: FormData) => {
    const result = await updateClientData(userId, formData)

    if (result.success) {
      toast.success('Cliente actualizado correctamente')
      router.push('/admin/clientes')
    } else {
      toast.error(result.message || 'Error al actualizar cliente')
    }
  }

  if (loading) {
    return <p className="p-6 text-muted-foreground">Cargando datos del cliente...</p>
  }

  if (!user) {
    return <p className="p-6 text-red-500">Cliente no encontrado.</p>
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Editar Cliente</h1>

      <form
        action={handleSubmit}
        className="space-y-4"
      >
        <div>
          <Label>Nombre</Label>
          <Input name="name" defaultValue={user.name} />
        </div>
        <div>
          <Label>Email</Label>
          <Input name="email" type="email" defaultValue={user.email} />
        </div>
        <div>
          <Label>Contraseña</Label>
          <Input name="password" type="password" placeholder="••••••••" />
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit">Guardar Cambios</Button>
        </div>
      </form>
    </div>
  )
}
