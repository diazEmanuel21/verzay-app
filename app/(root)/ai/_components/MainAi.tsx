// app/(root)/ai/_components/MainAi.tsx
"use client";

import { ChangeEvent, useCallback, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { BusinessPromptBuilder, ExtraInfoBuilder, FqaBuilder, PromptPreview, TrainingBuilder } from "./";
import { buildPrompt } from "./helpers";
import { BusinessValues, ExtrasDraftSchema, FaqDraftSchema, initialValues, MainAiProps, ManagementDraftSchema, ProductsDraftSchema, TrainingDraftSchema } from "@/types/agentAi";
import { ProductBuilder } from "./ProductBuilder";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, MoreVertical } from 'lucide-react';
import { cn } from "@/lib/utils";
import { PromptToolbar } from "./PromptToolbar";

import { buildExtrasMarkdown, buildFaqMarkdown, buildProductsMarkdown, buildTrainingMarkdown, buildManagementMarkdown } from "./helpers/actionsBuilders";
import { ManagementBuilder } from "./ManagementBuilder";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GenericDeleteDialog } from "@/components/shared/GenericDeleteDialog";
import { deleteAgentPromptsByUserId } from "@/actions/prompt-actions";


export const TYPE_AI_LABELS = {
    business: "Perfil",
    training: "Inicio",
    faq: "Preguntas",
    products: "Productos",
    more: "Extras",
    management: "Gestión",
} as const;
type TabKey = keyof typeof TYPE_AI_LABELS;

export const MainAi = ({ flows, user, promptMeta, sections }: MainAiProps) => {
    const [showAlertDialog, setShowAlertDialog] = useState(false)

    const trainingMd = sections?.training
        ? buildTrainingMarkdown(TrainingDraftSchema.parse(sections.training))
        : "";

    const faqMd = sections?.faq
        ? buildFaqMarkdown(FaqDraftSchema.parse(sections.faq))
        : "";

    const productsMd = sections?.products
        ? buildProductsMarkdown(ProductsDraftSchema.parse(sections.products))
        : "";

    const extrasMd = sections?.extras
        ? buildExtrasMarkdown(ExtrasDraftSchema.parse(sections.extras))
        : "";

    const managementMd = sections?.management
        ? buildManagementMarkdown(ManagementDraftSchema.parse(sections.management))
        : "";
    // 1) Hidrata estado local con lo que viene de BD (business)
    const hydrated: BusinessValues = {
        // Business
        nombre: sections?.business?.nombre ?? "",
        sector: sections?.business?.sector ?? "",
        ubicacion: sections?.business?.ubicacion ?? "",
        horarios: sections?.business?.horarios ?? "",
        maps: sections?.business?.maps ?? "",
        telefono: sections?.business?.telefono ?? "",
        email: sections?.business?.email ?? "",
        sitio: sections?.business?.sitio ?? "",
        facebook: sections?.business?.facebook ?? "",
        instagram: sections?.business?.instagram ?? "",
        tiktok: sections?.business?.tiktok ?? "",
        youtube: sections?.business?.youtube ?? "",
        notas: sections?.business?.notas ?? "",

        // ✅ Hidrata con el markdown real en vez de "[Contenido cargado]"
        training: trainingMd,
        faq: faqMd,
        products: productsMd,
        more: extrasMd,
        management: managementMd,
    };

    const [values, setValues] = useState<BusinessValues>({ ...initialValues, ...hydrated });
    const [activeTab, setActiveTab] = useState<TabKey>("business");
    const [promptVersion, setPromptVersion] = useState<number>(promptMeta.version); // ← versión viva
    const scrollRef = useRef<HTMLDivElement>(null);
    const saveHandlersRef = useRef<Record<string, () => Promise<void>>>({});

    const registerSaveHandler = useCallback(
        (key: string, handler: () => Promise<void>) => {
            saveHandlersRef.current[key] = handler;
        },
        []
    );

    const handleManualSaveAll = useCallback(async () => {
        const handlers = Object.values(saveHandlersRef.current);

        if (handlers.length === 0) return;

        // Ejecutamos cada handler
        const results = await Promise.allSettled(
            handlers.map((fn) => fn())   // 👈 AQUÍ las llamamos
        );

        const hasError = results.some((r) => r.status === "rejected");
        if (hasError) {
            throw new Error("Al menos una sección no se pudo guardar.");
        }
    }, []);

    const handleChange = useCallback(
        (key: keyof BusinessValues) =>
            (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                setValues((v) => ({ ...v, [key]: e.target.value }));
            },
        []
    );

    const handleTabClick = (key: TabKey) => setActiveTab(key);

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: direction === "left" ? -150 : 150, behavior: "smooth" });
    };

    const reset = () =>
        setValues({
            nombre: "",
            sector: "",
            ubicacion: "",
            horarios: "",
            maps: "",
            telefono: "",
            email: "",
            sitio: "",
            facebook: "",
            instagram: "",
            tiktok: "",
            youtube: "",
            notas: "",
            training: "",
            faq: "",
            products: "",
            more: "",
            management: "",
        });

    const prompt = useMemo(() => buildPrompt(values), [values]);

    return (

        <>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="w-full">
                {/* header de tabs (idéntico al tuyo) */}
                <div className="sticky w-full top-0 z-10 -mx-4 lg:mx-0 bg-slate-100 dark:bg-black">
                    <div className="flex items-center justify-between gap-2 px-2 py-2">
                        <Button variant="ghost" size="icon" onClick={() => scroll("left")} className="sm:hidden" aria-label="Desplazar pestañas a la izquierda">
                            <ArrowLeft />
                        </Button>
                        <div
                            ref={scrollRef}
                            className={cn("flex overflow-x-auto gap-2 pb-1 scrollbar-none", "sm:overflow-visible sm:justify-start sm:flex-wrap")}
                        >
                            {(Object.keys(TYPE_AI_LABELS) as TabKey[]).map((key) => (
                                <button
                                    key={key}
                                    onClick={() => handleTabClick(key)}
                                    className={cn(
                                        "px-4 py-2 rounded-t-md font-medium text-sm border-b-2 transition-colors duration-150 whitespace-nowrap",
                                        activeTab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                                    )}
                                    aria-pressed={activeTab === key}
                                    aria-label={`Cambiar a ${TYPE_AI_LABELS[key]}`}
                                >
                                    {TYPE_AI_LABELS[key]}
                                </button>
                            ))}
                            <PromptToolbar
                                promptId={promptMeta.id}
                                version={promptVersion}
                                userId={user.id}
                                onVersionChange={setPromptVersion}
                                onConflict={(serverState) => {
                                    // Si el servidor no trae sections, no hacemos nada raro
                                    const s = serverState?.sections;
                                    if (!s) {
                                        if (serverState?.version) setPromptVersion(serverState.version);
                                        return;
                                    }

                                    // 🔁 Reconstruimos los markdowns igual que al inicio
                                    const trainingMdServer = s.training
                                        ? buildTrainingMarkdown(TrainingDraftSchema.parse(s.training))
                                        : "";

                                    const faqMdServer = s.faq
                                        ? buildFaqMarkdown(FaqDraftSchema.parse(s.faq))
                                        : "";

                                    const productsMdServer = s.products
                                        ? buildProductsMarkdown(ProductsDraftSchema.parse(s.products))
                                        : "";

                                    const extrasMdServer = s.extras
                                        ? buildExtrasMarkdown(ExtrasDraftSchema.parse(s.extras))
                                        : "";

                                    const managementMdServer = s.management
                                        ? buildManagementMarkdown(ManagementDraftSchema.parse(s.management))
                                        : "";

                                    // 🧠 Rehidratamos todos los valores desde lo que dice el servidor
                                    setValues((prev) => ({
                                        ...prev,
                                        // Business
                                        nombre: s.business?.nombre ?? prev.nombre,
                                        sector: s.business?.sector ?? prev.sector,
                                        ubicacion: s.business?.ubicacion ?? prev.ubicacion,
                                        horarios: s.business?.horarios ?? prev.horarios,
                                        maps: s.business?.maps ?? prev.maps,
                                        telefono: s.business?.telefono ?? prev.telefono,
                                        email: s.business?.email ?? prev.email,
                                        sitio: s.business?.sitio ?? prev.sitio,
                                        facebook: s.business?.facebook ?? prev.facebook,
                                        instagram: s.business?.instagram ?? prev.instagram,
                                        tiktok: s.business?.tiktok ?? prev.tiktok,
                                        youtube: s.business?.youtube ?? prev.youtube,
                                        notas: s.business?.notas ?? prev.notas,

                                        // Resto de secciones (markdown ya armado)
                                        training: trainingMdServer,
                                        faq: faqMdServer,
                                        products: productsMdServer,
                                        more: extrasMdServer,
                                        management: managementMdServer,
                                    }));

                                    // 🔀 Sincronizamos versión local con la del servidor
                                    if (serverState?.version) {
                                        setPromptVersion(serverState.version);
                                    }

                                    // (Opcional) Si quieres, aquí podrías lanzar un toast:
                                    // toast.warning("Se detectaron cambios en otra sesión. Se cargó la última versión del servidor.");
                                }}
                                revalidatePath={"/ia"}
                                revisions={[]}
                                onManualSave={handleManualSaveAll}
                            />

                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" aria-label="Open menu" size="icon">
                                        <MoreVertical />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-40" align="end">
                                    {/* <DropdownMenuLabel>Acciones</DropdownMenuLabel> */}
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem onSelect={() => setShowAlertDialog(true)}>
                                            Eliminar todo
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>

                        </div>
                        <Button variant="ghost" size="icon" onClick={() => scroll("right")} className="sm:hidden" aria-label="Desplazar pestañas a la derecha">
                            <ArrowRight />
                        </Button>

                    </div>
                </div>

                {/* layout */}
                <div className="flex flex-row w-full gap-2 max-h-[78vh]">
                    <div className="flex flex-1 flex-col min-h-0 overflow-y-auto pr-1 ">
                        <TabsContent value="business" className="m-0">
                            <BusinessPromptBuilder
                                user={user}
                                values={values}
                                handleChange={handleChange}
                                // 👇 meta para autosave con versionado
                                promptId={promptMeta.id}
                                version={promptVersion}
                                onVersionChange={setPromptVersion}
                                onConflict={(serverState) => {
                                    // Opcional: estrategia ante conflicto (otro guardó antes)
                                    // Por simpleza: rehidrata solo Business y toma version server
                                    const s = serverState?.sections?.business ?? {};
                                    setValues((prev) => ({
                                        ...prev,
                                        nombre: s.nombre ?? prev.nombre,
                                        sector: s?.sector ?? prev.sector,
                                        ubicacion: s?.ubicacion ?? prev.ubicacion,
                                        horarios: s?.horarios ?? prev.horarios,
                                        maps: s?.maps ?? prev.maps,
                                        telefono: s?.telefono ?? prev.telefono,
                                        email: s?.email ?? prev.email,
                                        sitio: s?.sitio ?? prev.sitio,
                                        facebook: s?.facebook ?? prev.facebook,
                                        instagram: s?.instagram ?? prev.instagram,
                                        tiktok: s?.tiktok ?? prev.tiktok,
                                        youtube: s?.youtube ?? prev.youtube,
                                        notas: s?.notas ?? prev.notas,
                                    }));
                                    if (serverState?.version) setPromptVersion(serverState.version);
                                }}
                                registerSaveHandler={(fn) => registerSaveHandler("business", fn)}
                            />
                        </TabsContent>

                        {/* Los otros tabs siguen igual por ahora */}
                        <TabsContent value="training" className="m-0">
                            <TrainingBuilder
                                flows={flows}
                                values={{ training: values.training ?? "" }}
                                handleChange={handleChange}
                                notificationNumber={user.notificationNumber}
                                promptId={promptMeta.id}
                                version={promptVersion}
                                onVersionChange={setPromptVersion}
                                onConflict={(serverState) => {
                                    setValues((prev) => ({ ...prev, training: prev.training }));
                                }}
                                initialSteps={sections?.training?.steps ?? []}
                                registerSaveHandler={(fn) => registerSaveHandler("training", fn)}
                            />
                        </TabsContent>

                        <TabsContent value="faq" className="m-0">
                            <FqaBuilder
                                flows={flows}
                                values={{ faq: values.faq ?? "" }}
                                handleChange={handleChange}
                                notificationNumber={user.notificationNumber}
                                promptId={promptMeta.id}
                                version={promptVersion}
                                onVersionChange={setPromptVersion}
                                onConflict={(serverState) => {
                                    setValues((prev) => ({ ...prev, faq: prev.faq }));
                                }}
                                initialItems={sections?.faq?.steps ?? []}
                                registerSaveHandler={(fn) => registerSaveHandler("faq", fn)}
                            />
                        </TabsContent>

                        <TabsContent value="products" className="m-0">
                            <ProductBuilder
                                flows={flows}
                                values={{ products: values.products ?? "" }}
                                handleChange={handleChange}
                                notificationNumber={user.notificationNumber}
                                promptId={promptMeta.id}
                                version={promptVersion}
                                onVersionChange={setPromptVersion}
                                onConflict={(serverState) => {
                                    setValues((prev) => ({ ...prev, products: prev.products }));
                                }}
                                initialItems={sections?.products?.steps ?? []}
                                registerSaveHandler={(fn) => registerSaveHandler("products", fn)}
                            />
                        </TabsContent>

                        <TabsContent value="more" className="m-0">
                            <ExtraInfoBuilder
                                flows={flows}
                                values={{ more: values.more ?? "" }}
                                handleChange={handleChange}
                                notificationNumber={user.notificationNumber}
                                promptId={promptMeta.id}
                                version={promptVersion}
                                onVersionChange={setPromptVersion}
                                onConflict={(serverState) => {
                                    setValues((prev) => ({ ...prev, more: prev.more }));
                                }}
                                initialExtras={{
                                    items: sections?.extras?.steps ?? [],
                                    firmaEnabled: sections?.extras?.firmaEnabled ?? false,
                                    firmaText: sections?.extras?.firmaText ?? undefined,
                                    firmaName: sections?.extras?.firmaName ?? undefined,
                                }}
                                registerSaveHandler={(fn) => registerSaveHandler("more", fn)}
                            />
                        </TabsContent>

                        <TabsContent value="management" className="m-0">
                            <ManagementBuilder
                                flows={flows}
                                values={{ management: values.management ?? "" }}
                                handleChange={handleChange}
                                notificationNumber={user.notificationNumber}
                                promptId={promptMeta.id}
                                version={promptVersion}
                                onVersionChange={setPromptVersion}
                                onConflict={(serverState) => {
                                    // rehidrata items del server en conflicto
                                    const serverItems = serverState?.sections?.management?.items ?? [];
                                    // si guardas un state global `sections`, actualízalo allí;
                                    // si solo mantienes `values`, basta con dejar el values.management tal cual,
                                    // autosave ya volverá a lanzar con la nueva versión.
                                }}
                                initialItems={sections?.management?.steps ?? []}
                                registerSaveHandler={(fn) => registerSaveHandler("management", fn)}
                            />
                        </TabsContent>
                        <div className="h-6" />
                    </div>

                    <aside className="hidden lg:block lg:w-[420px]">
                        <PromptPreview prompt={prompt} />
                    </aside>
                </div>
            </Tabs>
            <GenericDeleteDialog
                open={showAlertDialog}
                setOpen={setShowAlertDialog}
                itemName="auto prompt"
                itemId={user.id}
                mutationFn={() => deleteAgentPromptsByUserId(user.id)}
                entityLabel="todo el auto prompt"
            />
        </>
    );
};