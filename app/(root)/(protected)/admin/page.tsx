import ConexionButton from "@/components/shared/conexion";
import Header from "@/components/shared/header";
import { currentUser } from "@/lib/auth";

const AdminPage = async () => {
  const user = await currentUser();

  if (user?.role !== "admin") {
    return <div>Lo sentimos este portal solo esta hecho para distruibudores.</div>;
  };

  return (  
    <>
      <Header 
        title='Panel Administrativo'
        subtitle='Puedes administrar cualquier operacion en la plataforma'
      />
    <div className="p-2">
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ConexionButton
            title="Administrador Conexiones"
            description="Configura la api de sus cliente, puedes crear eliminar editar y cambiar la api de sus cliente"
            link="/admin/conexion"
            buttonLabel="Ir a Conexión"
          />
          <ConexionButton
            title="Administrador Clientes"
            description="Configura cada cliente, puedes agregar, editar, eliminar y cambiar su informacion."
            link="admin/clientes"
            buttonLabel="Ir a Clientes"
          />
          
        {/* Agrega más botones o *cards* si es necesario */}
      </div>
    </div>
    </>
  );
};
export default AdminPage;
