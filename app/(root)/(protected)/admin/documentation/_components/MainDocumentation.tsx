'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, FileCog, Play } from 'lucide-react'

export const MainDocumentation = () => {

    const modules = [
        {
            title: "Administrador tutoriales",
            description: "Gestión de videos tutoriales por modulo.",
            icon: <Play className="text-red-600" />,
            href: "/admin/documentation/tutorial",
            buttonLabel: "Ir a Tutoriales",
        },
        {
            title: "Administrador guías",
            description: "Gestion de documentación/manuales de usuario.",
            icon: <BookOpen className="text-blue-600" />,
            href: "/admin/documentation/guide",
            buttonLabel: "Ir a Guías",
        },
        {
            title: "Plantillas IA",
            description: "Crea y gestiona plantillas para prompts personalizados.",
            icon: <FileCog className="text-teal-600" />,
            href: "/admin/templates",
            buttonLabel: "Ir a Plantillas",
        },
    ]

    return (
        <div className="flex flex-wrap gap-2 items-center">
            {modules.map((card, index) => (
                <Card
                    key={index}
                    className="
                    flex flex-col 
                    justify-between 
                    border-border 
                    rounded-2xl 
                    transition-all 
                    duration-300 
                    hover:shadow-lg 
                    hover:scale-[1.015] 
                    hover:border-primary 
                    bg-background
                    max-w-80
                    min-w-80"
                >
                    <CardHeader className="p-5 pb-3">
                        <div className="flex flex-row gap-4">
                            <div className="p-2 bg-muted rounded-xl w-fit">{card.icon}</div>
                            <CardTitle className="text-base font-semibold overflow-hidden">{card.title}</CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <CardDescription className="text-sm text-muted-foreground line-clamp-2 leading-snug">
                            {card.description}
                        </CardDescription>
                    </CardContent>

                    <CardFooter className="p-5 pt-3">
                        <Button
                            asChild
                            className="w-full transition-all duration-300 hover:scale-[1.01]"
                        >
                            <Link href={card.href}>{card.buttonLabel}</Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}