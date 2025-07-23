import { UnderConstruction } from "@/components/custom"
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ApiKey, Instancias } from "@prisma/client";
import { getInstancesByUserId } from "@/actions/instances-actions";
import { getApiKeyById } from "@/actions/api-action";
import { fetchInstanceAction } from "@/actions/fetch-intance-action";
import { ConnectionMain } from "./connection/_components";

function hasInstancia(result: { data?: Instancias | null }): result is { data: Instancias } {
  return !!result.data
};

function hasApikey(result: { data?: ApiKey | null }): result is { data: ApiKey } {
  return !!result.data
};

const Home = async ({ searchParams }: SearchParamProps) => {
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  const resInstancia = await getInstancesByUserId(user.id);
  const instance = resInstancia.success && hasInstancia(resInstancia) ? resInstancia.data : undefined;

  const resApikey = await getApiKeyById(user.apiKeyId)
  const apiKey = hasApikey(resApikey) ? resApikey.data : null

  let instanceInfo = null;

  if (apiKey && instance) {
    instanceInfo = await fetchInstanceAction({
      evoApiKey: apiKey.key,
      evoUrl: apiKey.url,
      instanceName: instance.instanceName
    });
  }

  return (
    <div className="flex flex-1 flex-wrap gap-4 items-center justify-center">
      <ConnectionMain user={user} instance={instance} instanceInfo={instanceInfo?.data} />
      {/* <UnderConstruction /> */}
    </div>
  )
}

export default Home