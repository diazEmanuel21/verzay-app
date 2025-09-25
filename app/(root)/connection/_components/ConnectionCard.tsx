'use client'

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { SubmitHandler, useForm } from "react-hook-form"
import { FormInstanceConnectionValues, FormInstanceConnectionSchema } from '@/schema/connection'
import { FaInstagram, FaFacebook, FaWhatsapp } from "react-icons/fa"
import { useMemo, useCallback } from "react"

interface MinimalUser {
  onFacebook?: boolean
  onInstagram?: boolean
}

interface ConnectionCardProps {
  userId: string
  user: MinimalUser
  loading: boolean
  defaultValues: FormInstanceConnectionValues
  instanceType: string // Facebook | Instagram | Whatsapp | ...
  handleSubmit: SubmitHandler<FormInstanceConnectionValues>
}

interface SocialIconSelectorProps {
  instanceType: string
}

const isStrictTrue = (v: unknown) => v === true

const SocialIconSelector = ({ instanceType }: SocialIconSelectorProps) => {
  const t = (instanceType || '').trim().toLowerCase()

  if (t === 'instagram') {
    return (
      <>
        <FaInstagram className="text-pink-500 rounded-sm w-6 h-6" />
        <span className="text-xl font-bold">Instagram</span>
      </>
    )
  }
  if (t === 'facebook') {
    return (
      <>
        <FaFacebook className="text-blue-500 rounded-sm w-6 h-6" />
        <span className="text-xl font-bold">Facebook</span>
      </>
    )
  }
  if (t === 'whatsapp' || t === 'whatsapp business' || t === 'whatsappb') {
    return (
      <>
        <FaWhatsapp className="text-green-500 rounded-sm w-6 h-6" />
        <span className="text-xl font-bold">WhatsApp</span>
      </>
    )
  }
  return <span className="text-xl font-bold">{instanceType || 'Canal'}</span>
}

export const ConnectionCard = ({
  handleSubmit,
  userId,
  user,
  loading,
  defaultValues,
  instanceType
}: ConnectionCardProps) => {
  const type = (instanceType || '').trim().toLowerCase()
  const isFacebook = type === 'facebook'
  const isInstagram = type === 'instagram'
  const isFacebookOrInstagram = isFacebook || isInstagram

  // Habilitado SOLO si el flag es EXACTAMENTE true
  const isChannelEnabled = useMemo(() => {
    if (isFacebook) return isStrictTrue(user.onFacebook)
    if (isInstagram) return isStrictTrue(user.onInstagram)
    // WhatsApp u otros: sin límites aquí
    return true
  }, [isFacebook, isInstagram, user.onFacebook, user.onInstagram])

  // Facebook/Instagram desactivado -> mostrar aviso y NO renderizar formulario
  if (isFacebookOrInstagram && !isChannelEnabled) {
    return (
      <Card className="border-border max-w-96">
        <CardHeader className="flex flex-row items-center justify-center p-6">
          <CardTitle className="text-center text-2xl font-bold flex items-center gap-2">
            <SocialIconSelector instanceType={instanceType} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            role="status"
            aria-live="polite"
            className="text-sm rounded-md border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-amber-800 dark:text-amber-300"
          >
            Consultar con un administrador para activar
          </div>
        </CardContent>
      </Card>
    )
  }

  // Renderizar formulario (FB/IG habilitados; WhatsApp y otros siempre)
  const form = useForm<FormInstanceConnectionValues>({
    resolver: zodResolver(FormInstanceConnectionSchema),
    defaultValues: {
      ...defaultValues,
      tipoInstancia: instanceType, // se envía tal cual llega
    },
    mode: 'onSubmit',
  })

  const onSubmit = useCallback<SubmitHandler<FormInstanceConnectionValues>>(
    (values, ev) => {
      handleSubmit(values, ev)
    },
    [handleSubmit]
  )

  return (
    <Card className="border-border max-w-96">
      <CardHeader className="flex flex-row items-center justify-center p-6">
        <CardTitle className="text-center text-2xl font-bold flex items-centergap-2">
          <SocialIconSelector instanceType={instanceType} />
        </CardTitle>
      </CardHeader>

      <Form {...form}>
        <form id="instance-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="instanceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Instancia</FormLabel>
                  <FormControl>
                    <Input placeholder="Company S.A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo oculto para enviar el tipo de instancia */}
            <FormField
              control={form.control}
              name="tipoInstancia"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input type="hidden" {...field} value={instanceType} readOnly />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              aria-disabled={loading}
              title="Crear Instancia"
            >
              {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
              Crear Instancia
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
