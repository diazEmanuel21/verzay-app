"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { EmployeeForm } from "./EmployeeForm";
import type { Employee } from "@prisma/client";
import { columns } from "./EmployeeColumns";
import { EmpoloyeeDataTable } from "./EmpoloyeeDataTable";
import { MainEmployeesProps } from "@/types/employees";

export function MainEmployees({ user, employees }: MainEmployeesProps) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Employee | null>(null);

    return (
        <div className="w-full p-4">
            <Card className="border-muted/50">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Empleados</CardTitle>
                    <Button onClick={() => { setEditing(null); setOpen(true); }}>
                        <PlusCircle className="h-4 w-4 mr-2" /> Nuevo
                    </Button>
                </CardHeader>
                <CardContent>
                    <EmpoloyeeDataTable columns={columns(setEditing, setOpen)} data={employees} />
                </CardContent>
            </Card>

            <EmployeeForm
                open={open}
                setOpen={setOpen}
                userId={user.id}
                employee={editing}
            />
        </div>
    );
}
