import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserWithPausar } from "@/lib/types"
import { ApiKey } from "@prisma/client"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react"

interface Props {
  openEditDialog: boolean
  setOpenEditDialog: (open: boolean) => void
  handleEdit: (userId: string, formData: FormData) => void
  user: UserWithPausar,
  apikeys: ApiKey[]
}

export const EditDialog = ({
  openEditDialog,
  setOpenEditDialog,
  handleEdit,
  user,
  apikeys
}: Props) => {
  const [selectedApiKey, setSelectedApiKey] = useState<string | undefined>(user.apiKeyId || undefined)

  return (
    <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
          <DialogDescription>
            Realiza cambios del cliente aquí. Guarda los cambios cuando termines.
          </DialogDescription>
        </DialogHeader>

        <form
          action={(formData) => {
            handleEdit(user.id, formData)
          }}
        >
          {/* campo oculto para enviar el apiKeyId seleccionado */}
          <input type="hidden" name="apiKeyId" value={selectedApiKey} />

          <div className="overflow-auto max-h-96 pr-2">
            <div className="grid gap-4 py-4">

              {/* Campos normales */}
              {[
                { id: "name", label: "Nombre", defaultValue: user.name },
                { id: "email", label: "Email", defaultValue: user.email },
                { id: "password", label: "Contraseña", defaultValue: user.password },
                { id: "role", label: "Rol", defaultValue: user.role },
                { id: "apiUrl", label: "Apikey OpenIA", defaultValue: user.apiUrl },
                { id: "company", label: "Empresa", defaultValue: user.company },
                { id: "notificationNumber", label: "Teléfono Notificación", defaultValue: user.notificationNumber },
                { id: "openMsg", label: "Frase de reactivación", defaultValue: user.pausar.filter(p => p.tipo === 'abrir')[0]?.mensaje },
                { id: "lat", label: "Latitud", defaultValue: user.lat },
                { id: "lng", label: "Longitud", defaultValue: user.lng },
                { id: "mapsUrl", label: "Maps URL", defaultValue: user.mapsUrl },
              ].map(({ id, label, defaultValue }) => (
                <div className="grid grid-cols-4 items-center gap-4" key={id}>
                  <Label htmlFor={id} className="text-right">{label}</Label>
                  <Input
                    id={id}
                    name={id}
                    defaultValue={defaultValue ?? ""}
                    className="col-span-3"
                  />
                </div>
              ))}

              {/* Select personalizado para apiKey */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="apiKeyId" className="text-right">Evo - API Key</Label>
                <Select
                  value={selectedApiKey}
                  onValueChange={setSelectedApiKey}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona una API Key" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>API Keys disponibles</SelectLabel>
                      {apikeys.map(({ id, url }) => (
                        <SelectItem key={id} value={id}>
                          {url}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}