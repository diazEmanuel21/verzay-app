"use client"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, Pencil, Trash2, Bot } from "lucide-react"

interface ConnectionActionsInterface {
    handleDelete: () => void;
    handleRename: () => void;
    handlePrompt?: () => void;
}

export const ConnectionActions = ({ handleDelete, handleRename, handlePrompt }: ConnectionActionsInterface) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* <DropdownMenuItem onClick={handleRename}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar nombre
                </DropdownMenuItem> */}
                {handlePrompt && (
                    <DropdownMenuItem onClick={handlePrompt}>
                        <Bot className="h-4 w-4 mr-2" />
                        Editar Agente IA
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar instancia
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
