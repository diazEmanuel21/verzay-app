import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Header from '@/components/shared/header'
import { currentUser } from '@/lib/auth'
import Link from 'next/link'
import { BookOpenCheck, Settings, ShieldCheck, Users,  } from 'lucide-react'

const AdminPage = async () => {
  const user = await currentUser()

  if (!user) {
    return <div className="text-center py-10">No autorizado.</div>
  }

  const allCards = [
    {
      title: "Administrador API",
      description: "Configura la API de tus clientes. Puedes crear, eliminar y cambiar la configuración.",
      icon: <Settings className="text-blue-600" />,
      href: "/admin/conexion",
      buttonLabel: "Ir a Conexión",
    },
    {
      title: "Administrador Clientes",
      description: "Configura cada cliente. Puedes agregar, editar, eliminar y cambiar su información.",
      icon: <Users className="text-green-600" />,
      href: "/admin/clientes",
      buttonLabel: "Ir a Clientes",
    },
    {
      title: "Administrador Resellers",
      description: "Gestiona a tus revendedores y su acceso a clientes o configuraciones.",
      icon: <ShieldCheck className="text-purple-600" />,
      href: "/admin/reseller",
      buttonLabel: "Ir a Resellers",
    },
    {
      title: "Administrador Guías",
      description: "Gestiona las guías para cada modulo.",
      icon: <BookOpenCheck className="text-yellow-600" />,
      href: "/admin/guide",
      buttonLabel: "Ir a Guías",
    },
  ]

  // 🔐 Filtrar según rol del usuario
  const visibleCards =
    user.role === "reseller"
      ? allCards.filter(card => card.title === "Administrador Clientes")
      : allCards

  return (
    <>
      <Header
        title="Panel Super Administrativo"
        subtitle="Puedes administrar cualquier operación en la plataforma"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        {visibleCards.map((card, index) => (
          <Card
            key={index}
            className="flex flex-col justify-between border border-border rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-[1.015] hover:border-primary bg-background w-full"
          >
            <CardHeader className="p-5 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="p-2 bg-muted rounded-xl w-fit">{card.icon}</div>
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-base font-semibold">{card.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground line-clamp-2 leading-snug">
                    {card.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <div className="flex-grow" />

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
    </>
  )
}

export default AdminPage