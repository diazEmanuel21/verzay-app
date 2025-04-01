import { currentUser } from "@/lib/auth";
import { agregarApi } from "@/actions/api-action";
import ApiKeysTable from "@/components/shared/apikeystable";

interface Props {
  searchParams: { [key: string]: string | undefined }
}

const AdminPage = async ({ searchParams }: Props) => {
  const user = await currentUser();

  if (user?.role !== "admin") {
    return <div>Lo sentimos este portal solo esta hecho para distruibudores.</div>;
  };

  return (
    <div className="container">
      {/* Mensajes de éxito o error */}
      {searchParams.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {searchParams.success}
        </div>
      )}

      {searchParams.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {searchParams.error}
        </div>
      )}

      <div className="container">
        <form action={agregarApi} className="flex flex-col gap-y-4">
          <div className="mb-4">
            <input
              type="text"
              name="url"
              placeholder="Ingresa la url de Evolution"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              name="key"
              placeholder="Ingresa la Apikey"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <input
            type="hidden"
            name="userId"
            value={user?.id}
          />
          <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            AGREGAR
          </button>
        </form>
      </div>

      <ApiKeysTable />
    </div>
  );
};

export default AdminPage;
