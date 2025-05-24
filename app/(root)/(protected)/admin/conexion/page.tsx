'use server'

import { currentUser } from "@/lib/auth";
import { obtenerApiKeys } from "@/actions/api-action";
import { MainConnection } from "./_components";

interface Props {
  searchParams: { [key: string]: string | undefined }
}

const ConnectionPage = async ({ searchParams }: Props) => {
  const user = await currentUser();

  if (!user || user?.role !== "admin") {
    return <div>Lo sentimos este portal solo esta hecho para distruibudores.</div>;
  };

  const result = await obtenerApiKeys();

  if (!result.data) {
    return <h1>Error al cargar las apikey</h1>;
  }

  return (
    <>
      <MainConnection searchParams={searchParams} user={user} apiKeys={result.data} />
    </>
  );
};

export default ConnectionPage;

