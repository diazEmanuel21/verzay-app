
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from "@prisma/client";

interface Props {
  openEditDialog: boolean
  setOpenEditDialog: (open: boolean) => void
  handleEdit: (userId: string, formData: FormData) => void
  user: User,
}

export const EditDialog = ({
  openEditDialog,
  setOpenEditDialog,
  handleEdit,
  user
}: Props) => {
  return (
    <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
      <DialogContent >
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
          <DialogDescription>
            {"Realiza cambios del cliente aquí. Guarda los cambios cuando termines."}
          </DialogDescription>
        </DialogHeader>

        <form
          action={(formData) => {
            handleEdit(user?.id, formData)
          }}
        >
          <div className="overflow-auto max-h-96 pr-2">
            <div className="grid gap-4 py-4">
              {[
                { id: "name", label: "Nombre", defaultValue: user.name },
                { id: "email", label: "Email", defaultValue: user.email },
                { id: "password", label: "Contraseña", defaultValue: user.password },
                { id: "role", label: "Rol", defaultValue: user.role },
                { id: "apiUrl", label: "Apikey OpenIA", defaultValue: user.apiUrl },
                { id: "company", label: "Empresa", defaultValue: user.company },
                { id: "notificationNumber", label: "Teléfono Notificación", defaultValue: user.notificationNumber },
                { id: "lat", label: "Latitud", defaultValue: user.lat },
                { id: "lng", label: "Longitud", defaultValue: user.lng },
                { id: "mapsUrl", label: "Maps URL", defaultValue: user.mapsUrl },
              ].map(({ id, label, defaultValue }) => (
                <div className="grid grid-cols-4 items-center gap-4" key={id}>
                  <Label htmlFor={id} className="text-right">
                    {label}
                  </Label>
                  <Input
                    id={id}
                    name={id}
                    defaultValue={defaultValue ?? ""}
                    className="col-span-3"
                  />
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
