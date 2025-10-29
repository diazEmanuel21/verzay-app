// app/(root)/ai/_components/MainAi.tsx
"use client";

import { ChangeEvent, useCallback, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { BusinessPromptBuilder, ExtraInfoBuilder, FqaBuilder, PromptPreview, TrainingBuilder } from "./";
import { buildPrompt } from "./helpers";
import { BusinessValues, ExtrasDraftSchema, FaqDraftSchema, initialValues, MainAiProps, ProductsDraftSchema, SectionsPromptSystem, TrainingDraftSchema } from "@/types/agentAi";
import { ProductBuilder } from "./ProductBuilder";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PromptToolbar } from "./PromptToolbar";

import { buildTrainingMarkdown } from "./helpers/buildTrainingMarkdown";
import { buildFaqMarkdown } from "./helpers/buildFaqMarkdown";
import { buildProductsMarkdown } from "./helpers/buildProductsMarkdown";
import { buildExtrasMarkdown } from "./helpers/buildExtrasMarkdown";

export const TYPE_AI_LABELS = {
    business: "Perfil",
    training: "Inicio",
    faq: "Preguntas",
    products: "Productos",
    more: "Extras",
} as const;
type TabKey = keyof typeof TYPE_AI_LABELS;

export const MainAi = ({ flows, user, promptMeta, sections }: MainAiProps) => {
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
    // 1) Hidrata estado local con lo que viene de BD (business)
    const hydrated: BusinessValues = {
        // Business
        nombre: user?.company ?? sections?.business?.nombre ?? "",
        sector: sections?.business?.sector ?? "",
        ubicacion: sections?.business?.ubicacion ?? "",
        horarios: sections?.business?.horarios ?? "",
        maps: user?.mapsUrl ?? sections?.business?.maps ?? "",
        telefono: user?.notificationNumber ?? sections?.business?.telefono ?? "",
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
    };

    const [values, setValues] = useState<BusinessValues>({ ...initialValues, ...hydrated });
    const [activeTab, setActiveTab] = useState<TabKey>("business");
    const [promptVersion, setPromptVersion] = useState<number>(promptMeta.version); // ← versión viva
    const scrollRef = useRef<HTMLDivElement>(null);

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
        });

    const prompt = useMemo(() => buildPrompt(values), [values]);

    return (
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
                            onConflict={(server) => {
                                // Rehidrata si quieres: sections, tabs, etc.
                                // setSections(server.sections); setPromptVersion(server.version);
                            }}
                            revalidatePath={"/ia"}
                            revisions={[]}
                        />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => scroll("right")} className="sm:hidden" aria-label="Desplazar pestañas a la derecha">
                        <ArrowRight />
                    </Button>

                </div>
            </div>

            {/* layout */}
            <div className="flex flex-row w-full gap-2 max-h-[87vh]">
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
                                    nombre: user?.company ?? s?.nombre ?? prev.nombre,
                                    sector: s?.sector ?? prev.sector,
                                    ubicacion: s?.ubicacion ?? prev.ubicacion,
                                    horarios: s?.horarios ?? prev.horarios,
                                    maps: user?.mapsUrl ?? s?.maps ?? prev.maps,
                                    telefono: user?.notificationNumber ?? s?.telefono ?? prev.telefono,
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
                        />
                    </TabsContent>

                    <TabsContent value="products" className="m-0">
                        <ProductBuilder
                            notificationNumber={user.notificationNumber}
                            flows={flows}
                            values={{ products: values.products ?? "" }}
                            handleChange={handleChange}
                            // NUEVO:
                            promptId={promptMeta.id}
                            version={promptVersion}
                            onVersionChange={setPromptVersion}
                            onConflict={(serverState) => { /* opcional */ }}
                            initialItems={sections?.products?.items ?? []}
                        />
                    </TabsContent>

                    <TabsContent value="more" className="m-0">
                        <ExtraInfoBuilder
                            notificationNumber={user.notificationNumber}
                            flows={flows}
                            values={{ more: values.more ?? "" }}
                            handleChange={handleChange}
                            // Persistencia:
                            promptId={promptMeta.id}
                            version={promptVersion}
                            onVersionChange={setPromptVersion}
                            onConflict={(serverState) => { /* opcional */ }}
                            initialExtras={{
                                items: sections?.extras?.items ?? [],
                                firmaEnabled: sections?.extras?.firmaEnabled ?? false,
                                firmaText: sections?.extras?.firmaText ?? undefined,
                                firmaName: sections?.extras?.firmaName ?? undefined,
                            }}
                        />
                    </TabsContent>
                    <div className="h-6" />
                </div>

                <aside className="hidden lg:block lg:w-[420px]">
                    <PromptPreview prompt={prompt} />
                </aside>
            </div>
        </Tabs>
    );
};
