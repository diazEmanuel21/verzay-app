
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from "@prisma/client";

type UserWithPausar = User & { pausarMensaje?: string };
interface Props {
  openEditDialog: boolean
  setOpenEditDialog: (open: boolean) => void
  handleEdit: (userId: string, formData: FormData) => void
  user: UserWithPausar,
}

export const EditDialog = ({
  openEditDialog,
  setOpenEditDialog,
  handleEdit,
  user
}: Props) => {
  return (

    <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
          <DialogDescription>
            {"Realiza cambios del cliente aquí. Guarda los cambios cuando termines..."}
          </DialogDescription>
        </DialogHeader>
        <form
          action={(formData) => {
            handleEdit(user?.id, formData)
          }}
        >
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value="Pedro Duarte" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input id="username" value="@peduarte" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog >
  )
}
