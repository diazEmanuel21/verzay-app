'use client';

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function WorkflowNodesSidebarTrigger() {
    const { toggleSidebar } = useSidebar();

    return (
        <Button
            size="icon"
            onClick={toggleSidebar}
            title="Agregar nodo"
        >
            <Plus className="h-4 w-4" />
        </Button>
    );
}