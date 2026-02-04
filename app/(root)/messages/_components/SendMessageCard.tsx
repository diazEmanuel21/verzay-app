'use client'

import * as React from 'react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send } from 'lucide-react'
import { sendingMessages } from '@/actions/sending-messages-actions'
import { toast } from 'sonner'
import type { UserWithApiKeys } from '../../../../schema/schema'

type Props = {
    user: UserWithApiKeys
}

export default function SendMessageCard({ user }: Props) {
    const userUrl = user.apiKey?.url
    const userApiKey = user.apiKey?.key
    const userInstance = user.instancias?.[0]?.instanceName

    // OJO: si userUrl ya viene con https://, elimina el "https://"
    const sendTextUrl = userUrl && userInstance ? `https://${userUrl}/message/sendText/${userInstance}` : ''

    const [remoteJid, setRemoteJid] = React.useState('573107964105@s.whatsapp.net')
    const [text, setText] = React.useState('')
    const [loading, setLoading] = React.useState(false)

    const hasConfig = !!sendTextUrl && !!userApiKey
    const canSend = hasConfig && remoteJid.trim().length > 0 && text.trim().length > 0 && !loading

    const onSend = async () => {
        if (!hasConfig) {
            return toast.error('Este usuario no tiene configuración (url/apikey/instancia) para enviar mensajes.')
        }
        if (!remoteJid.trim() || !text.trim()) {
            return toast.error('Faltan datos: RemoteJid y mensaje.')
        }
        if (loading) return

        setLoading(true)
        try {
            const res = await sendingMessages({
                url: sendTextUrl,
                apikey: userApiKey!,
                remoteJid,
                text,
            })

            if (!res.success) return toast.error(res.message || 'No se pudo enviar')

            toast.success(res.message || 'Mensaje enviado')
            setText('')
        } catch (e: any) {
            toast.error(`Fallo inesperado: ${e?.message ?? String(e)}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="rounded-2xl">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <CardTitle className="text-base">Enviar mensaje (WhatsApp)</CardTitle>
                    </div>

                    {!!remoteJid.trim() && (
                        <Badge variant="secondary" className="text-xs font-mono">
                            {remoteJid}
                        </Badge>
                    )}
                </div>

                {!hasConfig && (
                    <p className="text-xs text-destructive mt-2">
                        Falta configuración del usuario (apiKey / url / instancia).
                    </p>
                )}
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label className="text-xs">RemoteJid</Label>
                    <Input
                        value={remoteJid}
                        onChange={(e) => setRemoteJid(e.target.value)}
                        placeholder="573107964105@s.whatsapp.net"
                        className="h-9 text-sm font-mono"
                    />
                </div>

                <div className="grid gap-2">
                    <Label className="text-xs">Mensaje</Label>
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Escribe tu mensaje..."
                        className="min-h-[110px] text-sm"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{text.trim().length} caracteres</span>
                        <span className="font-mono">delay=1200</span>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                    <Button onClick={onSend} disabled={!canSend} className="gap-2">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Enviar
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}