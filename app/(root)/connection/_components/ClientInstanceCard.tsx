'use client'

import EnableToggleButton from '@/components/button-bot'
import QRCodeGenerator from '@/components/form-qr'
import { GenericDeleteDialog } from '@/components/shared/GenericDeleteDialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Users } from 'lucide-react'
import { useState } from 'react'
import { FaWhatsapp, FaInstagram, FaFacebook } from 'react-icons/fa'
import { ConnectionActions } from './'
import { deleteInstance } from '@/actions/api-action'
import { ClientInstanceCardProps } from '@/schema/connection'
import { Skeleton } from '@/components/ui/skeleton'
import { PromptInstanceDialog } from './PromptInstanceDialog'
import { randomUUID } from 'crypto'


interface SocialIconSelectorProps {
  instanceType?: string
  callback: () => void;
}

export const SocialIconSelector = ({ instanceType, callback }: SocialIconSelectorProps) => {

  switch (instanceType) {
    case 'Instagram':
      return <>
        <FaInstagram
          onClick={callback}
          className="text-pink-500 rounded-sm"
        />
        <span className="text-sm font-bold">Instagram</span>
        <hr className="w-4 rotate-90" />
            <span className="text-sm text-gray-400">Business</span>
            <span className="text-sm text-pink-500">avanzado</span>
      </>
    case 'Facebook':
      return <>
        <FaFacebook
          onClick={callback}
          className="text-blue-500 rounded-sm"
        />
        <span className="text-sm font-bold">Facebook</span>
        <hr className="w-4 rotate-90" />
            <span className="text-sm text-gray-400">Business</span>
            <span className="text-sm text-blue-500">avanzado</span>
      </>
    case 'Whatsapp':
    default:
      return <>
        <FaWhatsapp
          onClick={callback}
          className="text-green-500 rounded-sm"
        />
        <span className="text-sm font-bold">Whatsapp</span>
        <hr className="w-4 rotate-90" />
            <span className="text-sm text-gray-400">Business</span>
            <span className="text-sm text-green-500">avanzado</span>
      </>
  }
};

export const ClientInstanceCard = ({
  intanceName,
  instanceType,
  user,
  currentInstanceInfo
}: ClientInstanceCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [clickCount, setClickCount] = useState(0)
  const handleSecretClick = () => {
    // Incrementa el contador de clicks
    setClickCount(prevCount => prevCount + 1);

    // Si el contador es 3, muestra el modal y resetea el contador
    if (clickCount + 1 === 3) {
      setShowDeleteDialog(true);
      setClickCount(0); // Opcional: reiniciar el contador
    }
  };

  const instanceId = currentInstanceInfo?.id;
  const ownerJid = currentInstanceInfo?.ownerJid;
  const profileName = currentInstanceInfo?.profileName;
  const profilePicUrl = currentInstanceInfo?.profilePicUrl;
  const chats = currentInstanceInfo?._count?.Chat;
  const contacts = currentInstanceInfo?._count?.Contact;
  const messages = currentInstanceInfo?._count?.Message;
  const userInitial = intanceName.charAt(0).toUpperCase() ?? '?'

  return (
    <>
      <Card className="border-border max-w-96">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{intanceName}</CardTitle>
            <ConnectionActions handleDelete={setShowDeleteDialog} handlePrompt={setShowPromptDialog} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Avatar className="rounded-lg">
              {profilePicUrl && <AvatarImage src={profilePicUrl} alt={intanceName ?? ''} />}
              <AvatarFallback className="rounded-lg">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div>
              {profileName ? (
                <>
                  <div className="text-sm font-medium">{profileName}</div>
                  <div className="text-xs text-muted-foreground">+{ownerJid?.split('@')[0]}</div>
                </>
              ) : (
                <>
                  <Skeleton className="h-4 w-[120px] mb-1" />
                  <Skeleton className="h-3 w-[100px]" />
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 text-xs flex-col gap-2">
            {/* <div className="flex flex-1 items-center gap-2 text-muted-foreground justify-start w-full">
              <div className="flex items-center gap-1">
                <Users size={16} strokeWidth={1.5} />
                <span>{contacts}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle size={16} strokeWidth={1.5} />
                <span>{messages}</span>
              </div>
            </div> */}

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

            {/* <FaWhatsapp
              onClick={handleSecretClick}
              className="text-green-500 rounded-sm"
            />
            <span className="text-sm font-bold">Whatsapp</span> */}
            <SocialIconSelector
              instanceType={instanceType}
              callback={handleSecretClick}
            ></SocialIconSelector>

            {/* <hr className="w-4 rotate-90" />
            <span className="text-sm text-gray-400">Business</span>
            <span className="text-sm text-green-500">avanzado</span> */}
          </div>
        </CardFooter>
      </Card>

      <GenericDeleteDialog
        open={showDeleteDialog}
        setOpen={setShowDeleteDialog}
        itemName={'Agente IA'}
        itemId={instanceId ?? 'instance-123'}
        mutationFn={() => deleteInstance(user.id)}
        entityLabel="Agente IA"
      />
      <PromptInstanceDialog
      instanceType={instanceType}
        open={showPromptDialog}
        setOpen={setShowPromptDialog}
        userId=''
        key={''}
        defaultValues={undefined}
      ></PromptInstanceDialog>
    </>
  )
}