'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { User, Workflow } from '@prisma/client'

interface Props {
  user: User
  Workflows: Workflow[]
}

export const MainAutoReplies = ({ user, Workflows }: Props) => {
  const [phrase, setPhrase] = useState("")
  const [workflowId, setWorkflowId] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phrase || !workflowId) return alert("Debes completar todos los campos.")

    // try {
    //   const res = await fetch("/api/auto-replies", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ phrase, workflowId, userId: user.id })
    //   })

    //   if (!res.ok) throw new Error("Error al crear la respuesta rápida")

    //   alert("Respuesta rápida creada exitosamente")
    // } catch (err) {
    //   console.error(err)
    //   alert("Hubo un error al enviar el formulario")
    // }
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <h1>USUARIO</h1>
      {JSON.stringify(user)}
      <h1>FLUJOS</h1>
      {JSON.stringify(Workflows)}

      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Crear respuesta rapida</CardTitle>
          <CardDescription>Crea una respuesta rapida para tu flujo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="phrase">Palabra para ejecutar respuesta rapida <strong>(Obligatorio)</strong></Label>
                <Input
                  id="phrase"
                  placeholder="Ya le envío los bonais"
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="workflow">Seleccione el flujo <strong>(Obligatorio)</strong></Label>
                <Select onValueChange={(val) => setWorkflowId(val)}>
                  <SelectTrigger id="workflow">
                    <SelectValue placeholder="Selecciona un flujo" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {Workflows.map((wf) => (
                      <SelectItem key={wf.id} value={wf.id}>{wf.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardFooter className="mt-4">
              <Button type="submit" className="w-full">Iniciar</Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}