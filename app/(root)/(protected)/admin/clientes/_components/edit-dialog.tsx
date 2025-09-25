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
import { ClientInterface } from "@/lib/types"
import { ApiKey, Role } from "@prisma/client"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { VolumeX, Volume2 } from 'lucide-react'
import { PLAN_LABELS, PLANS } from "@/types/plans"

interface Props {
  openEditDialog: boolean
  setOpenEditDialog: (open: boolean) => void
  handleEdit: (userId: string, formData: FormData) => void
  user: ClientInterface
  apikeys: ApiKey[]
  currentUserRol: string
}

export const EditDialog = ({
  openEditDialog,
  setOpenEditDialog,
  handleEdit,
  user,
  apikeys,
  currentUserRol
}: Props) => {
  const openMsg = user.pausar.find(p => p.tipo === 'abrir')?.mensaje || '';
  const ROLES = Object.values(Role);
  const ROLE_LABELS: Record<Role, string> = {
    user: 'Usuario',
    admin: 'Administrador',
    reseller: 'Reseller',
  };

  let fields = [
    {
      id: "muteAgentResponses",
      label: "Silenciar agente",
      defaultValue: user.muteAgentResponses,
      readOnly: false,
    },
    // ✅ NUEVOS CAMPOS BOOLEANOS COMO CHECKBOX
    {
      id: "onFacebook",
      label: "Activar canal Facebook",
      defaultValue: user.onFacebook ?? false,
      readOnly: false,
    },
    {
      id: "onInstagran",
      label: "Activar canal Instagram",
      defaultValue: user.onInstagran ?? false,
      readOnly: false,
    },

    { id: "name", label: "Nombre", defaultValue: user.name, readOnly: false },
    { id: "email", label: "Email", defaultValue: user.email, readOnly: false },
    { id: "password", label: "Contraseña", defaultValue: user.password, readOnly: false },
    { id: "role", label: "Rol", defaultValue: user.role, readOnly: false },
    { id: "plan", label: "Plan", defaultValue: user.plan, readOnly: false },
    { id: "apiUrl", label: "Apikey OpenIA", defaultValue: user.apiUrl, readOnly: false },
    { id: "webhookUrl", label: "Webhook URL", defaultValue: user.webhookUrl, readOnly: false },
    { id: "company", label: "Empresa", defaultValue: user.company, readOnly: false },
    { id: "notificationNumber", label: "Teléfono Notificación", defaultValue: user.notificationNumber, readOnly: false },
    { id: "openMsg", label: "Frase de reactivación", defaultValue: openMsg, readOnly: false },
    { id: "mapsUrl", label: "Maps URL", defaultValue: user.mapsUrl, readOnly: false },
    { id: "lat", label: "Latitud", defaultValue: user.lat, readOnly: false },
    { id: "lng", label: "Longitud", defaultValue: user.lng, readOnly: false },
    { id: "apiKeyId", label: "Evo - API Key", defaultValue: user.apiKeyId, readOnly: false },
  ];

  /* Ocultar/mostrar fields para reseller */
  if (currentUserRol === 'reseller') {
    const idsToRemove = ["apiKeyId", "webhookUrl", "apiUrl"]
    fields = fields.filter(field => !idsToRemove.includes(field.id))

    const idsReadOnly = ["name","email","role","plan"]
    fields = fields.map(field =>
      idsReadOnly.includes(field.id)
        ? { ...field, readOnly: true }
        : field
    )
  };

  const handleRenderField = (
    id: string,
    defaultValue: string | number | boolean | null | undefined,
    readOnly?: boolean
  ) => {
    switch (id) {
      case 'apiKeyId':
        return (
          <Select name={id} defaultValue={defaultValue?.toString() ?? ""} disabled={readOnly}>
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
          <Select name={id} defaultValue={defaultValue?.toString() ?? ""} disabled={readOnly}>
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

      case 'plan':
        return (
          <Select name={id} defaultValue={defaultValue?.toString() ?? ""} disabled={readOnly}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Selecciona un plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {PLANS.map(plan => (
                  <SelectItem key={plan} value={plan}>
                    {PLAN_LABELS[plan]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )

      case 'muteAgentResponses':
        return (
          <Select name={id} defaultValue={defaultValue ? 'true' : 'false'} disabled={readOnly}>
            <SelectTrigger className="col-span-3">
              <SelectValue
                placeholder="Silenciar respuestas"
                className="flex gap-2 items-center"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="true">
                  <div className="flex items-center gap-2">
                    <VolumeX className="w-4 h-4 text-destructive" />
                    <span>Activado</span>
                    <Badge variant="destructive" className="ml-auto">Silenciado</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="false">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-green-500 dark:text-green-400" />
                    <span>Desactivado</span>
                    <Badge variant="outline" className="ml-auto text-green-600 border-green-600 dark:text-green-400 dark:border-green-400">
                      Responde
                    </Badge>
                  </div>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        )

      // ✅ Render de CHECKBOX para booleanos onFacebook / onInstagran
      case 'onFacebook':
      case 'onInstagran': {
        const checked = Boolean(defaultValue);
        return (
          <div className="col-span-3 flex items-center gap-3">
            {/* Asegura envío de 'false' cuando NO está marcado */}
            <input type="hidden" name={id} value="false" />
            <input
              id={id}
              name={id}
              type="checkbox"
              defaultChecked={checked}
              value="true"
              disabled={readOnly}
              className="h-4 w-4 accent-foreground cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="text-sm text-muted-foreground">
              {checked ? 'Activado' : 'Desactivado'}
            </span>
          </div>
        )
      }

      default:
        return (
          <Input
            id={id}
            name={id}
            defaultValue={defaultValue?.toString() ?? ""}
            className="col-span-3"
            readOnly={readOnly}
            disabled={readOnly}
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
              {fields.map(({ id, label, defaultValue, readOnly }) => (
                <div className="grid grid-cols-4 items-center gap-4" key={id}>
                  <Label htmlFor={id} className="text-right">{label}</Label>
                  {handleRenderField(id, defaultValue, readOnly)}
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
