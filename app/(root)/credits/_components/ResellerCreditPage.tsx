'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useAnimation, useInView } from 'framer-motion'
import { Headphones } from "lucide-react"
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { ShieldCheck, Star, Sparkles, CheckCircle, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { ChevronDoubleDownIcon } from '@heroicons/react/24/solid'
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover"

import { User } from '@prisma/client'

const plans = [
    {
        name: 'PYMES',
        features: [
            'Interpretación audios',
            'Memoria contextual',
            'Notificación a otro número',
            'Solicitudes o citas',
            '1 flujo por WhatsApp',
            'CRM en Google Sheets',
        ],
        featured: false,
        href: (num: string) => `https://wa.me/+${num}?text=Hola%2C%20quiero%20actualizar%20mi%20plan%20a%20PYMES`,
    },
    {
        name: 'BUSINESS',
        features: [
            'Interpretación audios',
            'Múltiples archivos',
            'Pedidos o citas',
            'Respuestas con archivos',
            '3 flujos en tu WhatsApp',
            'Captura y envía a Sheets',
        ],
        featured: true,
        href: (num: string) => `https://wa.me/+${num}?text=Hola%2C%20quiero%20actualizar%20mi%20plan%20a%20BUSINESS`,
    },
    {
        name: 'EMPRESARIAL',
        features: [
            'Interpretación audios',
            'Lee imágenes (png, jpeg)',
            'Solicitudes o pedidos',
            'Seguimientos automáticos',
            '5 flujos activos',
            'Google Sheets bidireccional',
        ],
        featured: false,
        href: (num: string) => `https://wa.me/+${num}?text=Hola%2C%20quiero%20actualizar%20mi%20plan%20a%20EMPRESARIAL`,
    },
]

interface propsReseller {
    resellerInformation: User | null
}

export const ResellerCreditPage = ({ resellerInformation }: propsReseller) => {
    const planSectionRef = useRef<HTMLDivElement | null>(null)
    const isInView = useInView(planSectionRef, { once: false, margin: '-100px' })
    const controls = useAnimation()
    const [highlightButton, setHighlightButton] = useState(false)

    const numberReseller = resellerInformation?.notificationNumber.toString();

    useEffect(() => {
        if (isInView) {
            controls.start('visible')
        }
    }, [isInView, controls])

    useEffect(() => {
        const timer = setTimeout(() => {
            setHighlightButton(true)
        }, 8000)
        return () => clearTimeout(timer)
    }, [])

    return (
        // <div className="bg-gradient-to-br from-gray-100 via-white to-blue-200 dark:from-dark-600 dark:via-gray-900 dark:to-dark-700">
        <>
            {/* HERO SECTION */}
            <section className="relative min-h-screen flex flex-col items-center">
                <Card className="w-full shadow-2xl border-none bg-white/70 dark:bg-dark-600/70 backdrop-blur-lg">
                    <CardContent className="flex flex-col-reverse lg:flex-row items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="flex-1 space-y-6"
                        >
                            <h1 className="text-4xl font-extrabold leading-tight text-[#1C61E7] dark:text-white flex items-center gap-2">
                                ¡Actualiza tu plan y desbloquea tu potencial!
                            </h1>
                            <p className="text-lg text-muted-foreground dark:text-gray-300">
                                Lleva tu negocio al siguiente nivel al mejorar tu plan. Accede a herramientas avanzadas de inteligencia artificial, automatización profesional y soporte prioritario.
                            </p>

                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-sm">
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    Precios exclusivos para ti
                                </li>
                                <li className="flex items-center gap-2 text-sm">
                                    <ShieldCheck className="w-4 h-4 text-green-600" />
                                    Acceso garantizado y soporte directo
                                </li>
                                <li className="flex items-center gap-2 text-sm">
                                    <Sparkles className="w-4 h-4 text-[#1C61E7]" />
                                    Potencia tu negocio con IA
                                </li>
                            </ul>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-0 right-4 bg-white dark:bg-[#1c1c2b] border border-[#1C61E7]/20 shadow-sm hover:bg-[#1C61E7]/10"
                                    >
                                        <Headphones className="w-5 h-5 text-[#1C61E7]" />
                                        <span className="sr-only">Ver asesor</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent>
                                    <h2 className="text-base font-semibold text-[#1C61E7] dark:text-white flex items-center gap-2 pb-2">
                                        <ShieldCheck className="w-4 h-4 text-green-500" />
                                        Tu asesor de confianza
                                    </h2>
                                    <div className="text-sm space-y-1 text-zinc-800 dark:text-gray-200 pb-4">
                                        <p className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-yellow-500" />
                                            <span className="font-medium">Nombre:</span> {resellerInformation?.name}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Star className="w-4 h-4 text-[#1C61E7]" />
                                            <span className="font-medium">Correo:</span> {resellerInformation?.email}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <ChevronDown className="w-4 h-4 text-green-600" />
                                            <span className="font-medium">WhatsApp:</span> +{resellerInformation?.notificationNumber}
                                        </p>
                                    </div>
                                    <Link
                                        href={`https://wa.me/+${resellerInformation?.notificationNumber}?text=Hola%2C%20tengo%20una%20duda%20sobre%20mi%20plan`}
                                        target="_blank"
                                    >
                                        <Button variant="outline" className="w-full border-[#1C61E7] text-[#1C61E7] hover:bg-[#1C61E7]/10 transition-all">
                                            Chatear con asesor
                                        </Button>
                                    </Link>
                                </PopoverContent>
                            </Popover>

                            <Button
                                size="lg"
                                className={`mt-6 px-6 py-3 text-base bg-[#1C61E7] hover:bg-[#1553ca] text-white transition-all duration-500 ${highlightButton ? 'ring-4 ring-[#1C61E7]/40 shadow-xl scale-[1.03]' : ''
                                    }`}
                                onClick={() => {
                                    planSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
                                }}
                            >
                                Mejorar mi plan ahora
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="flex-1 max-w-sm hidden lg:block p-8"
                        >
                            <Image
                                src="/assets/image/reseller_upgrade.svg"
                                alt="Compra con confianza"
                                width={400}
                                height={400}
                                className="object-contain drop-shadow-xl"
                            />
                        </motion.div>
                    </CardContent>
                </Card>

                <motion.div
                    onClick={() => {
                        planSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute bottom-28 cursor-pointer"
                >
                    <ChevronDoubleDownIcon className="w-10 h-10 text-[#1C61E7] dark:text-white" />
                </motion.div>
            </section>

            {/* PLAN SECTION */}
            <section ref={planSectionRef} className="min-h-screen flex items-center justify-center flex-col">
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
                    variants={{
                        hidden: {},
                        visible: {
                            transition: {
                                staggerChildren: 0.2,
                            },
                        },
                    }}
                    initial="hidden"
                    animate={controls}
                >
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            className={`rounded-2xl p-6 shadow-xl border-2 transition-all duration-300 transform hover:scale-[1.03] hover:shadow-2xl ${plan.featured
                                ? 'bg-[#1C61E7] text-white border-[#1C61E7]'
                                : 'bg-white/80 dark:bg-dark-500/80 text-zinc-900 dark:text-white border-zinc-200 dark:border-gray-700 hover:border-[#1C61E7]'
                                }`}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            viewport={{ once: false, amount: 0.3 }}
                        >
                            <h3 className="text-2xl font-bold mb-4 text-center">{plan.name}</h3>
                            <ul className="space-y-2 mb-6 text-sm">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <CheckCircle
                                            className={`w-4 h-4 ${plan.featured ? 'text-white' : 'text-[#1C61E7]'}`}
                                        />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link href={plan.href(numberReseller as string)} target="_blank">
                                <Button
                                    className={`w-full ${plan.featured
                                        ? 'bg-white text-[#1C61E7] hover:bg-gray-100'
                                        : 'bg-[#1C61E7] text-white hover:bg-[#1553ca]'
                                        }`}
                                >
                                    Solicitar actualización
                                </Button>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </section>
        </>
    )
}
