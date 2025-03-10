import { db } from "@/lib/db";
import { createUser, deleteUser, updateUser } from "@/actions/clientes-action";

export default async function ClientesPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Gestión de Clientes</h1>

      {/* Formulario Crear Cliente */}
      <form action={createUser} className="space-y-4 border p-4 rounded">
        <h2 className="font-semibold text-lg">Agregar Cliente</h2>

        <div>
          <label className="block">Nombre</label>
          <input
            type="text"
            name="name"
            className="border px-2 py-1 w-full"
            required
          />
        </div>

        <div>
          <label className="block">Email</label>
          <input
            type="email"
            name="email"
            className="border px-2 py-1 w-full"
            required
          />
        </div>

        <div>
          <label className="block">Contraseña</label>
          <input
            type="text"
            name="password"
            className="border px-2 py-1 w-full"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Crear
        </button>
      </form>

      {/* Lista de Clientes */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Lista de Clientes</h2>

        {users.length === 0 ? (
          <p>No hay clientes.</p>
        ) : (
          <ul className="space-y-2">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex justify-between items-center border p-4 rounded"
              >
                <div>
                  <p className="font-medium">{user.name || "Sin nombre"}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>

                <div className="flex gap-2">
                  {/* Formulario inline para editar */}
                  <form
                    action={async (formData) => {
                      "use server";
                      await updateUser(user.id, formData);
                    }}
                    className="flex gap-1 items-center"
                  >
                    <input
                      type="text"
                      name="name"
                      defaultValue={user.name || ""}
                      className="border px-2 py-1"
                      required
                    />
                    <input
                      type="email"
                      name="email"
                      defaultValue={user.email}
                      className="border px-2 py-1"
                      required
                    />
                    <input
                      type="text"
                      name="password"
                      defaultValue={user.password || ""}
                      className="border px-2 py-1"
                      required
                    />

                    <button
                      type="submit"
                      className="bg-yellow-500 text-white px-2 py-1 rounded"
                    >
                      Editar
                    </button>
                  </form>

                  {/* Botón eliminar */}
                  <form
                    action={async () => {
                      "use server";
                      await deleteUser(user.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
