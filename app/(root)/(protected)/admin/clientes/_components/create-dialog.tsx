'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiKey } from '@prisma/client'

interface Props {
  openCreateDialog: boolean
  setOpenCreateDialog: (open: boolean) => void
  handleCreate: (formData: FormData) => void
  apikeys: ApiKey[]
}

export const CreateDialog = ({
  openCreateDialog,
  setOpenCreateDialog,
  handleCreate,
  apikeys
}: Props) => {
  const [name, setName] = useState('Carlos Arcos')
  const [email, setEmail] = useState('instancia-000@verzay.com')
  const [password, setPassword] = useState('Verzay.123456')
  const [selectedApiKey, setSelectedApiKey] = useState<string | undefined>()

  return (
    <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear cliente</DialogTitle>
          <DialogDescription>
            Rellena los campos para crear un nuevo perfil.
          </DialogDescription>
        </DialogHeader>
        <form
          action={(formData) => {
            handleCreate(formData)
          }}
        >
          <input type="hidden" name="apiKeyId" value={selectedApiKey} />
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nombre</Label>
              <Input name="name" value={name} onChange={(e) => setName(e.target.value)} required className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="evo" className="text-right">Evo URL</Label>
              <Select value={selectedApiKey} onValueChange={setSelectedApiKey} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona una API Key" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>API Keys disponibles</SelectLabel>
                    {
                      apikeys.map(({ id, url }) => (
                        <SelectItem key={id} value={id} className='cursor-pointer'>{url}</SelectItem>
                      ))
                    }
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">Contraseña</Label>
              <Input name="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
