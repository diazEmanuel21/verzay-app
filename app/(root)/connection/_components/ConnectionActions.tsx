"use client"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings } from "lucide-react"

interface ConnectionActionsInterface {
    handleDelete: (state: boolean) => void,
    handlePrompt: (state: boolean) => void
};

export const ConnectionActions = ({ handleDelete,handlePrompt }: ConnectionActionsInterface) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size={'icon'} onClick={()=>handlePrompt(true)}>
                    <Settings className="h-4 w-4 text-muted-foreground cursor-pointer" />
                </Button>
            </DropdownMenuTrigger>
            {/* <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                    onClick={() => handleDelete(true)}
                >
                    Eliminar
                </DropdownMenuCheckboxItem>
            </DropdownMenuContent> */}
        </DropdownMenu>
    )
}