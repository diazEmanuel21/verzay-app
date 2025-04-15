"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { User } from "@prisma/client"

interface Props {
  searchParams: { [key: string]: string | undefined },
  user: User
}

interface Client {
  id: string
  name: string
}

export const MainReseller = ({ searchParams, user }: Props) => {
  const [resellers, setResellers] = useState<User[]>([])
  const [selectedReseller, setSelectedReseller] = useState<string>("")
  const [assignedClients, setAssignedClients] = useState<Client[]>([])
  const [unassignedClients, setUnassignedClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // Datos falsos para pruebas
    setResellers([
      { id: "res1", name: "María Vendedora" } as User,
      { id: "res2", name: "Carlos Comercial" } as User
    ])

    setUnassignedClients([
      { id: "cli1", name: "Juan Cliente" },
      { id: "cli2", name: "Ana Empresaria" },
      { id: "cli3", name: "Pedro Tech" }
    ])
  }, [])

  const handleResellerChange = (resellerId: string) => {
    setSelectedReseller(resellerId)

    // Simulación: traer clientes asignados (mock)
    if (resellerId === "res1") {
      setAssignedClients([
        { id: "cli4", name: "Laura StartUp" },
        { id: "cli5", name: "Daniel Agencia" }
      ])
    } else if (resellerId === "res2") {
      setAssignedClients([
        { id: "cli6", name: "Jorge Innovador" }
      ])
    } else {
      setAssignedClients([])
    }
  }

  const assignClient = (client: Client) => {
    if (!selectedReseller) return
    setAssignedClients(prev => [...prev, client])
    setUnassignedClients(prev => prev.filter(c => c.id !== client.id))
  }

  const removeClient = (client: Client) => {
    setUnassignedClients(prev => [...prev, client])
    setAssignedClients(prev => prev.filter(c => c.id !== client.id))
  }

  const filteredAssignedClients = assignedClients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de clientes por revendedor</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        {/* Selector de revendedor */}
        <div className="grid gap-2">
          <Label>Selecciona un revendedor</Label>
          <Select onValueChange={handleResellerChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              {resellers.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro por nombre */}
        <div>
          <Label>Buscar cliente</Label>
          <Input
            placeholder="Escribe el nombre del cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Lista de clientes asignados */}
        <div>
          <Label>Clientes asignados</Label>
          <ScrollArea className="h-60 border rounded-lg p-2 mt-2">
            {filteredAssignedClients.map(client => (
              <div key={client.id} className="flex justify-between items-center p-2 hover:bg-muted rounded">
                <span>{client.name}</span>
                <Button size="sm" variant="destructive" onClick={() => removeClient(client)}>Eliminar</Button>
              </div>
            ))}
            {filteredAssignedClients.length === 0 && (
              <p className="text-sm text-muted-foreground text-center mt-2">No hay clientes asignados</p>
            )}
          </ScrollArea>
        </div>

        {/* Lista de clientes sin asignar */}
        <div>
          <Label>Clientes sin asignar</Label>
          <ScrollArea className="h-60 border rounded-lg p-2 mt-2">
            {unassignedClients.map(client => (
              <div key={client.id} className="flex justify-between items-center p-2 hover:bg-muted rounded">
                <span>{client.name}</span>
                <Button size="sm" onClick={() => assignClient(client)}>Asignar</Button>
              </div>
            ))}
            {unassignedClients.length === 0 && (
              <p className="text-sm text-muted-foreground text-center mt-2">No hay clientes pendientes</p>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
