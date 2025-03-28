'use client'

import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, MessageSquare } from 'lucide-react';

const initialClients = [
    { id: 'abc123', phone: '123456789', name: 'Juan Pérez', active: true, joined: '2024-03-01' },
    { id: 'abc123', phone: '987654321', name: 'María López', active: false, joined: '2024-02-15' },
];

const initialHistory = [
    { id: 'abc123', client: 'Juan Pérez', message: 'Hola, necesito ayuda con...' },
    { id: 'abc123', client: 'María López', message: 'No puedo ingresar a mi cuenta...' },
];

export const SessionComponent = () => {
    const [clients, setClients] = useState(initialClients);
    const [sessionActive, setSessionActive] = useState(true);
    const [history, setHistory] = useState(initialHistory);

    const toggleClientStatus = (id: string) => {
        setClients(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
    };

    const deleteClient = (id: string) => {
        setClients(prev => prev.filter(c => c.id !== id));
    };

    const deleteHistory = (id: string) => {
        setHistory(prev => prev.filter(h => h.id !== id));
    };

    return (
        <div className="container mx-auto">
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Teléfono</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Fecha de Ingreso</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.map(client => (
                                <TableRow key={client.id}>
                                    <TableCell>{client.phone}</TableCell>
                                    <TableCell>{client.name}</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={client.active}
                                            onCheckedChange={() => toggleClientStatus(client.id)}
                                        />
                                    </TableCell>
                                    <TableCell>{client.joined}</TableCell>
                                    <TableCell>
                                        <Button variant="destructive" size="icon" onClick={() => deleteClient(client.id)}>
                                            <Trash2 size={18} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Conversación del Agente</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Mensaje</TableHead>
                                <TableHead>Eliminar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.map(entry => (
                                <TableRow key={entry.id}>
                                    <TableCell>{entry.client}</TableCell>
                                    <TableCell>{entry.message}</TableCell>
                                    <TableCell>
                                        <Button variant="destructive" size="icon" onClick={() => deleteHistory(entry.id)}>
                                            <Trash2 size={18} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
