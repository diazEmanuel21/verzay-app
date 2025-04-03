import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/shared/header';
import { currentUser } from '@/lib/auth';
import Link from 'next/link';

const AdminPage = async () => {
  const user = await currentUser();

  if (user?.role !== "admin") {
    return <div className="text-center py-10">Lo sentimos, este portal solo está disponible para distribuidores.</div>;
  }

  return (
    <>
      <Header
        title="Panel Administrativo"
        subtitle="Puedes administrar cualquier operación en la plataforma"
      />

      <div className="p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          <Card>
            <CardHeader>
              <CardTitle>Administrador Conexiones</CardTitle>
              <CardDescription>
                Configura la API de tus clientes. Puedes crear, eliminar, editar y cambiar la configuración API.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <Link href="/admin/conexion">Ir a Conexión</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Administrador Clientes</CardTitle>
              <CardDescription>
                Configura cada cliente. Puedes agregar, editar, eliminar y cambiar su información.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <Link href="/admin/clientes">Ir a Clientes</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Aquí puedes agregar más cards según necesites */}

        </div>
      </div>
    </>
  );
};

export default AdminPage;
