import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserWithPausar } from "@/lib/types"
import { ApiKey, Role } from "@prisma/client"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

interface Props {
  openEditDialog: boolean
  setOpenEditDialog: (open: boolean) => void
  handleEdit: (userId: string, formData: FormData) => void
  user: UserWithPausar
  apikeys: ApiKey[]
}


export const EditDialog = ({
  openEditDialog,
  setOpenEditDialog,
  handleEdit,
  user,
  apikeys
}: Props) => {
  const openMsg = user.pausar.find(p => p.tipo === 'abrir')?.mensaje || '';
  const ROLES = Object.values(Role);
  const ROLE_LABELS: Record<Role, string> = {
    user: 'Usuario',
    admin: 'Administrador',
    business: 'Business',
    empresarial: 'Empresarial',
    pymes: 'Pymes'
  }

  const fields = [
    { id: "name", label: "Nombre", defaultValue: user.name },
    { id: "email", label: "Email", defaultValue: user.email },
    { id: "password", label: "Contraseña", defaultValue: user.password },
    { id: "role", label: "Rol", defaultValue: user.role },
    { id: "apiUrl", label: "Apikey OpenIA", defaultValue: user.apiUrl },
    { id: "company", label: "Empresa", defaultValue: user.company },
    { id: "notificationNumber", label: "Teléfono Notificación", defaultValue: user.notificationNumber },
    { id: "openMsg", label: "Frase de reactivación", defaultValue: openMsg },
    { id: "lat", label: "Latitud", defaultValue: user.lat },
    { id: "lng", label: "Longitud", defaultValue: user.lng },
    { id: "mapsUrl", label: "Maps URL", defaultValue: user.mapsUrl },
    { id: "apiKeyId", label: "Evo - API Key", defaultValue: user.apiKeyId }
  ]

  const handleRenderField = (
    id: string,
    defaultValue: string | number | null | undefined
  ) => {
    switch (id) {
      case 'apiKeyId':
        return (
          <Select name={id} defaultValue={defaultValue?.toString() ?? ""}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Selecciona una API Key" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {apikeys.map(({ id, url }) => (
                  <SelectItem key={id} value={id}>
                    {url}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )

      case 'role':
        return (
          <Select name={id} defaultValue={defaultValue?.toString() ?? ""}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Selecciona un rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {ROLES.map(role => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )

      default:
        return (
          <Input
            id={id}
            name={id}
            defaultValue={defaultValue?.toString() ?? ""}
            className="col-span-3"
          />
        )
    }
  }

  return (
    <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
          <DialogDescription>
            Realiza cambios del cliente aquí. Guarda los cambios cuando termines.
          </DialogDescription>
        </DialogHeader>

        <form action={(formData) => handleEdit(user.id, formData)}>
          <div className="overflow-auto max-h-96 pr-2">
            <div className="grid gap-4 py-4">
              {fields.map(({ id, label, defaultValue }) => (
                <div className="grid grid-cols-4 items-center gap-4" key={id}>
                  <Label htmlFor={id} className="text-right">{label}</Label>
                  {handleRenderField(id, defaultValue)}
                </div>
              ))}
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
