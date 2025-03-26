'use client'

import { User } from '@prisma/client'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileText, FileSpreadsheet, Folder } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

type UserWithPausar = User & { pausarMensaje?: string }

interface Props {
  user: UserWithPausar
  openToolsDialog: boolean
  setOpenToolsDialog: (open: boolean) => void
  handleSaveTools: (formData: FormData) => void
}

const FormSchema = z.object({
  drive: z.string().min(5, {
    message: 'El enlace de Drive debe tener al menos 5 caracteres.',
  }),
  docs: z.string().min(5, {
    message: 'El enlace de Docs debe tener al menos 5 caracteres.',
  }),
  sheets: z.string().min(5, {
    message: 'El enlace de Sheets debe tener al menos 5 caracteres.',
  }),
})

type ToolValues = z.infer<typeof FormSchema>

const tools = [
  {
    id: 'drive',
    label: 'Google Drive',
    description: 'Introduce el enlace de la carpeta de Google Drive.',
    placeholder: 'https://drive.google.com/drive/folders/...',
    icon: <Folder className="w-5 h-5 text-blue-600" />,
  },
  {
    id: 'docs',
    label: 'Google Docs',
    description: 'Introduce el enlace de Google Docs.',
    placeholder: 'https://docs.google.com/document/...',
    icon: <FileText className="w-5 h-5 text-blue-500" />,
  },
  {
    id: 'sheets',
    label: 'Google Sheets',
    description: 'Introduce el enlace de Google Sheets.',
    placeholder: 'https://docs.google.com/spreadsheets/...',
    icon: <FileSpreadsheet className="w-5 h-5 text-green-600" />,
  },
] as const

export const ToolsDialog = ({
  user,
  openToolsDialog,
  setOpenToolsDialog,
  handleSaveTools,
}: Props) => {

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      drive: '',
      docs: '',
      sheets: '',
    },
  });
  
  const handleBlur = (key: keyof ToolValues) => {
    const currentValue = form.getValues(key)
    console.log('VALORES DEL FORM', form.getValues()) // Debería mostrar drive, docs y sheets
    debugger;

    const initialValue = form.formState.defaultValues?.[key]

    // No hacer nada si el valor no cambió
    if (currentValue === initialValue) return

    // Validar con Zod el campo individual
    const result = FormSchema.shape[key].safeParse(currentValue)
    if (!result.success) return;

    const formData = new FormData()
    formData.append(key, currentValue)
    formData.append('userId', user.id)

    handleSaveTools(formData)
  };

  return (
    <Dialog open={openToolsDialog} onOpenChange={setOpenToolsDialog}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar herramientas</DialogTitle>
          <DialogDescription>
            Cada campo se guardará automáticamente al salir del foco.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6">
            {tools.map(({ id, label, description, placeholder, icon }) => (
              <FormField
                key={id}
                control={form.control}
                name={id as keyof ToolValues}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">{icon} {label}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={placeholder}
                        {...field}
                        onBlur={() => handleBlur(id as keyof ToolValues)}
                      />
                    </FormControl>
                    <FormDescription>{description}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
