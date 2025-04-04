import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

interface NodeActionsProps {
  onDeleteFile: () => void
  onDeleteNode: () => void
  onEditType: () => void
  onChangePosition: () => void
}

export function NodeActions({
  onDeleteFile,
  onDeleteNode,
  onEditType,
  onChangePosition
}: NodeActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onDeleteFile}>
          🗑️ Eliminar archivo
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDeleteNode}>
          🧩 Eliminar nodo
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEditType}>
          ✏️ Editar tipo de nodo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
