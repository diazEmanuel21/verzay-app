'use client'

import { deleteGuide } from '@/actions/guide-actions'
import { GenericDeleteDialog } from '@/components/shared/GenericDeleteDialog'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { User } from '@prisma/client'
import { Eye, Copy, Trash2, Settings, MessageCircle, Users } from 'lucide-react'
import { useState } from 'react'
import { FaWhatsapp } from 'react-icons/fa'
import { toast } from 'sonner'

interface ClientInstanceCardProps {
  intanceName: string
  user: User
  intanceNumber: string
  connected: boolean
  messages: number
  contacts: number
  apiKey: string
}

const instanceId = 'ABC123'

export const ClientInstanceCard = ({
  intanceName,
  user,
  intanceNumber,
  connected,
  messages,
  contacts,
  apiKey,
}: ClientInstanceCardProps) => {
  const [showKey, setShowKey] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const userInitial = user?.name?.charAt(0).toUpperCase() ?? '?'

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey)
    toast.success('API Key copiada')
  }

  return (
    <Card className="border-border max-w-96">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{intanceName}</CardTitle>
          <Settings className="h-4 w-4 text-muted-foreground cursor-pointer" />
        </div>
        <CardDescription>Gestiona tu conexión con nuestra IA</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mt-3">
          <Avatar className="rounded-lg">
            {user?.image && <AvatarImage src={user?.image} alt={user?.name ?? ''} />}
            <AvatarFallback className="rounded-lg">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium">{user?.name}</div>
            <div className="text-xs text-muted-foreground">{intanceNumber}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users size={16} strokeWidth={1.5} />
              <span>{contacts}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle size={16} strokeWidth={1.5} />
              <span>{messages}</span>
            </div>
          </div>
          <div className="flex justify-end gap-1">
            <div className={`text-xs font-medium px-2 py-1 rounded-full ${connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {connected ? 'Conectado' : 'Desconectado'}
            </div>
            <Switch id="airplane-mode" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-row justify-center items-center">

        <Button
          variant={"ghost"}
          onClick={() => setShowDeleteDialog(true)}
        >
          <FaWhatsapp
            className="text-green-500 rounded-sm"
          />
          <span className="font-bold">Whatsapp</span>
          <hr className="w-4 rotate-90" />
          <span className="text-gray-400">Business</span>
          <span className="text-green-500">avanzado</span>
        </Button>
        <GenericDeleteDialog
          open={showDeleteDialog}
          setOpen={setShowDeleteDialog}
          itemName={'Bot IA'}
          itemId={instanceId}
          mutationFn={() => deleteGuide(instanceId)}
          entityLabel="Bot IA"
        />
      </CardFooter>
    </Card>
  )
}
