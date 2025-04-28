'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useAnimation, useInView } from 'framer-motion'
import { Headphones, Info, Mail, User2Icon, UserRoundCheck } from "lucide-react"
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { ShieldCheck, Star, Sparkles, CheckCircle, PhoneIcon } from 'lucide-react'
import Link from 'next/link'
import { ChevronDoubleDownIcon } from '@heroicons/react/24/solid'
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover"

import { User } from '@prisma/client'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
const plans = [
    {
        name: 'PYMES',
        features: [
            'Interpretación audios',
            'Sigue tu entrenamiento',
            'Tiene memoria contextual',
            'Toma solicitudes y/o citas',
            '1 agente IA por una línea WhatsApp',
            'Notificación de eventos a otro número',
            'Captura datos y registro en WhatsApp',
        ],
        featured: false,
        href: (num: string) => `https://wa.me/+${num}?text=Hola%2C%20quiero%20actualizar%20mi%20plan%20a%20PYMES`,
    },
    {
        name: 'BUSINESS',
        features: [
            'Interpretación audios',
            'Sigue tu entrenamiento',
            'Envío de múltiples archivos',
            'Toma solicitudes, pedidos o citas',
            '2 Agentes IA misma línea WhatsApp',
            'Notificación de eventos a otro número',
            'Captura y registro datos Google Sheets',
        ],
        featured: true,
        href: (num: string) => `https://wa.me/+${num}?text=Hola%2C%20quiero%20actualizar%20mi%20plan%20a%20BUSINESS`,
    },
    {
        name: 'EMPRESARIAL',
        features: [
            'Interpretación audios',
            'Lee imágenes en png y jpeg',
            'Toma solicitudes, pedidos o citas',
            'Respuestas rápidas envío archivos',
            '3 Agentes IA misma línea WhatsApp',
            'Captura y consulta en Google Sheets',
            'Seguimientos, recordatorios, inactividad',
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
    const textClass = "max-w-[200px] truncate whitespace-nowrap overflow-hidden text-left"

    const isAizen = !resellerInformation;

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

    const handlePlanUpgrade = () => {
        if (isAizen) {
            window.open(`https://wa.me/+57573115616975?text=Hola%2C%20quiero%20actualizar%20mi%20plan`, '_blank');
        } else {
            planSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        // <div className="bg-gradient-to-br from-gray-100 via-white to-blue-200 dark:from-dark-600 dark:via-gray-900 dark:to-dark-700">
        <div className="px-6">
            {/* HERO SECTION */}
            <section className="relative min-h-screen flex flex-col items-center tex">
                <div className="w-full border-none bg-transparent backdrop-blur-lg">
                    <div className="flex flex-col-reverse lg:flex-row items-center">
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
                            {!isAizen &&
                                <Popover >
                                    <PopoverTrigger asChild>
                                        <Button
                                            size="icon"
                                            className="absolute top-0 right-4"
                                        >
                                            <Info className="w-8 h-8" />
                                            <span className="sr-only">Ver asesor</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align='end'>
                                        <h2 className="text-base font-semibold text-[#1C61E7] dark:text-white flex items-center gap-2 pb-2">
                                            <ShieldCheck className="w-4 h-4 text-green-500" />
                                            Tu asesor de confianza
                                        </h2>
                                        <div className="text-sm space-y-1 p-2">
                                            <TooltipProvider>
                                                <div className="flex items-center gap-2">
                                                    <User2Icon className="w-4 h-4" />
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <p className={textClass}>
                                                                {resellerInformation?.company || "—"}
                                                            </p>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{resellerInformation?.company}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4" />
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <p className={textClass}>
                                                                {resellerInformation?.email || "—"}
                                                            </p>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{resellerInformation?.email}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <PhoneIcon className="w-4 h-4" />
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <p className={textClass}>
                                                                +{resellerInformation?.notificationNumber || "—"}
                                                            </p>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>+{resellerInformation?.notificationNumber}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </TooltipProvider>
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
                            }
                            <Button
                                size="lg"
                                className={`mt-6 px-6 py-3 text-base bg-[#1C61E7] hover:bg-[#1553ca] text-white transition-all duration-500 ${highlightButton ? 'ring-4 ring-[#1C61E7]/40 shadow-xl scale-[1.03]' : ''
                                    }`}
                                onClick={handlePlanUpgrade}
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
                    </div>
                </div>
                {
                    !isAizen &&
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
                }
            </section>

            {/* PLAN SECTION */}
            {
                !isAizen &&
                <section ref={planSectionRef} className="flex items-center justify-center flex-col">
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
            }
        </div>
    )
}
