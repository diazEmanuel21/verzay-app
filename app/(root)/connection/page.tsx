import { UnderConstruction } from "@/components/custom"
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ApiKey, Instancias, PromptInstance } from "@prisma/client";
import { getInstancesByUserId } from "@/actions/instances-actions";
import { getApiKeyById } from "@/actions/api-action";
import { fetchInstanceAction } from "@/actions/fetch-intance-action";
import { getPromptsByUserId } from "@/actions/prompt-actions";
import { ConnectionMain } from "./_components";

// Tipo de la respuesta esperada
interface ActionResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

// Adapta las funciones de tipo para manejar arrays
function hasInstancias(result: { data?: Instancias[] | null }): result is { data: Instancias[] } {
    return !!result.data && result.data.length > 0;
};

function hasApikey(result: { data?: ApiKey | null }): result is { data: ApiKey } {
    return !!result.data
};

function hasPrompts(result: { data?: PromptInstance[] | null }): result is { data: PromptInstance[] } {
    return !!result.data && result.data.length > 0;
};

// 🔹 Helper: normaliza el tipo (null/undefined -> "Whatsapp")
const normalizeType = (t?: string | null) => t ?? "Whatsapp";

const Home = async ({ searchParams }: SearchParamProps) => {
    const user = await currentUser();

    if (!user) {
        redirect("/login");
    }

    // Obtenemos instancias, API key y prompts en paralelo para mejorar la eficiencia
    const [resInstancias, resApikey, resPrompts] = await Promise.all([
        getInstancesByUserId(user.id),
        getApiKeyById(user.apiKeyId),
        getPromptsByUserId(user.id)
    ]);

    const instancias = hasInstancias(resInstancias) ? resInstancias.data : [];
    const apiKey = hasApikey(resApikey) ? resApikey.data : null;
    const prompts = hasPrompts(resPrompts) ? resPrompts.data : [];

    // Objeto para almacenar las instancias, su información y los prompts
    const instancesData: { [key: string]: { instance?: Instancias, info?: any, prompts?: PromptInstance[] } } = {
        'Whatsapp': { prompts: [] },
        'Instagram': { prompts: [] },
        'Facebook': { prompts: [] }
    };

    // Asignar las instancias y los prompts al objeto por su tipo (normalizado)
    instancias.forEach(instancia => {
        const type = normalizeType(instancia.instanceType);
        if (instancesData[type]) {
            instancesData[type].instance = instancia;
        }
    });

    prompts.forEach(prompt => {
        const type = normalizeType(prompt.instanceType);
        if (instancesData[type]) {
            instancesData[type].prompts?.push(prompt);
        }
    });

    if (apiKey) {
        // Itera sobre las instancias que se encontraron y hace la petición para cada una (usando tipo normalizado)
        const fetchPromises = instancias.map(async (instancia) => {
            const type = normalizeType(instancia.instanceType);
            if (instancesData[type]?.instance) {
                const instanceInfo = await fetchInstanceAction({
                    evoApiKey: apiKey.key,
                    evoUrl: apiKey.url,
                    instanceName: instancia.instanceName
                });

                instancesData[type].info = instanceInfo?.data;
            }
        });

        await Promise.all(fetchPromises);
    }

    return (
        <div className="flex flex-1 flex-wrap gap-4 items-center justify-center">
            <ConnectionMain
                user={user}
                instance={instancesData['Whatsapp'].instance}
                instanceInfo={instancesData['Whatsapp'].info}
                instanceType={'Whatsapp'}
                prompts={instancesData['Whatsapp'].prompts}
            />
            <ConnectionMain
                user={user}
                instance={instancesData['Instagram'].instance}
                instanceInfo={instancesData['Instagram'].info}
                instanceType={'Instagram'}
                prompts={instancesData['Instagram'].prompts}
            />
            <ConnectionMain
                user={user}
                instance={instancesData['Facebook'].instance}
                instanceInfo={instancesData['Facebook'].info}
                instanceType={'Facebook'}
                prompts={instancesData['Facebook'].prompts}
            />
        </div>
    )
}

export default Home;
