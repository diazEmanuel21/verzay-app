'use client'

import EnableToggleButton from '@/components/button-bot'
import QRCodeGenerator from '@/components/form-qr'
import { GenericDeleteDialog } from '@/components/shared/GenericDeleteDialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from '@prisma/client'
import { MessageCircle, Users } from 'lucide-react'
import { useState } from 'react'
import { FaWhatsapp } from 'react-icons/fa'
import { ConnectionActions } from './'
import { deleteInstance } from '@/actions/api-action'
interface ClientInstanceCardProps {
  intanceName: string
  user: User
  intanceNumber: string
  messages: number
  contacts: number
};

const instanceId = 'ABC123'

export const ClientInstanceCard = ({
  intanceName,
  user,
  intanceNumber,
  messages,
  contacts,
}: ClientInstanceCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const userInitial = user?.name?.charAt(0).toUpperCase() ?? '?'

  return (
    <>
      <Card className="border-border max-w-96">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{intanceName}</CardTitle>
            <ConnectionActions handleDelete={setShowDeleteDialog} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
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

          <div className="flex items-center justify-between mt-4 text-xs flex-col gap-2">
            <div className="flex flex-1 items-center gap-2 text-muted-foreground justify-start w-full">
              <div className="flex items-center gap-1">
                <Users size={16} strokeWidth={1.5} />
                <span>{contacts}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle size={16} strokeWidth={1.5} />
                <span>{messages}</span>
              </div>
            </div>

            <div className="flex flex-1 justify-end gap-1 items-center flex-row w-full">
              <QRCodeGenerator userId={user.id} />
              <EnableToggleButton
                userId={user.id}
                userName={user.name}
                apiurl={user.apiUrl}
                apikey={user.apiKeyId as string}
                webhookUrl={user?.webhookUrl ?? 'http://82.29.152.30:4001/webhook'}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-row justify-start items-center">

          <div className="flex flex-1 flex-row items-center gap-1">
            <FaWhatsapp
              className="text-green-500 rounded-sm"
            />
            <span className="text-sm font-bold">Whatsapp</span>
            <hr className="w-4 rotate-90" />
            <span className="text-sm text-gray-400">Business</span>
            <span className="text-sm text-green-500">avanzado</span>
          </div>


        </CardFooter>
      </Card>

      <GenericDeleteDialog
        open={showDeleteDialog}
        setOpen={setShowDeleteDialog}
        itemName={'Bot IA'}
        itemId={instanceId}
        mutationFn={() => deleteInstance(user.id)}
        entityLabel="Bot IA"
      />
    </>
  )
}