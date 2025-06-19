'use client'

import { PromptTemplate } from '@prisma/client'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'

interface TemplateListProps {
    templates: PromptTemplate[]
    onEdit: (template: PromptTemplate) => void
    onDelete: (idTemplate: string) => void
}

export const TemplateList = ({ templates, onEdit, onDelete }: TemplateListProps) => {
    if (!templates.length) {
        return (
            <p className="text-muted-foreground text-center mt-6">
                No hay plantillas registradas.
            </p>
        )
    }

    return (
        <>
            {templates.map((template) => (
                <Card key={template.id} className="flex flex-col justify-between shadow-sm border-border">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">{template.name}</CardTitle>
                    </CardHeader>

                    <CardContent className="text-sm text-muted-foreground">
                        <p className="line-clamp-3">{template.description || 'Sin descripción.'}</p>
                        <div className="mt-2 text-xs">
                            <strong>Categoría:</strong> {template.category || 'No definida'}
                            <br />
                            <strong>Estado:</strong> {template.isActive ? 'Activa' : 'Inactiva'}
                        </div>
                    </CardContent>

                    <CardFooter className="flex mt-auto gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            onClick={() => onDelete(template.id)}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            onClick={() => onEdit(template)}
                        >
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </>
    )
}