"use client";

import { useCallback, useEffect, useMemo, useRef, useTransition } from "react";
import useSWRInfinite from "swr/infinite";

import { CrmDashboard } from "./CrmDashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getRegistrosByUserId, updateRegistroEstado } from "@/actions/registro-action";
import { LoadingProgress } from "@/components/shared/LoadingProgress";
import { RegistroWithSession } from "@/types/session";

type MainDashboardProps = { userId: string };

const PAGE_SIZE = 50;

export const MainDashboard = ({ userId }: MainDashboardProps) => {
  const [isPending, startTransition] = useTransition();

  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadingMoreRef = useRef(false);
  const ioRef = useRef<IntersectionObserver | null>(null);

  const getKey = (pageIndex: number, previousPageData: RegistroWithSession[] | null) => {
    if (previousPageData && previousPageData.length < PAGE_SIZE) return null;
    return `${userId}-${pageIndex}`;
  };

  const { data, size, setSize, mutate, isLoading, isValidating, error } =
    useSWRInfinite<RegistroWithSession[]>(
      getKey,
      async (key: string) => {
        const [, pageIndex] = key.split("-");
        const page = parseInt(pageIndex, 10);

        const res = await getRegistrosByUserId(userId, page * PAGE_SIZE, PAGE_SIZE);
        if (!res.success) throw new Error(res.message || "No se pudieron cargar los registros");
        return res.data || [];
      },
      { revalidateAll: false, revalidateFirstPage: false }
    );

  const registros = useMemo(() => (data ? data.flat() : []), [data]);

  const hasMore = !data || (data[data.length - 1]?.length === PAGE_SIZE);

  // callback estable (no cambia cada render)
  const handleScrollRootReady = useCallback((el: HTMLDivElement | null) => {
    scrollRootRef.current = el;
  }, []);

  // libera lock al terminar
  useEffect(() => {
    if (!isValidating) loadingMoreRef.current = false;
  }, [isValidating]);

  // ÚNICO observer (aquí)
  useEffect(() => {
    const rootEl = scrollRootRef.current;
    const targetEl = sentinelRef.current;

    if (!rootEl || !targetEl) return;
    if (!data) return;
    if (!hasMore) return;

    ioRef.current?.disconnect();

    ioRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        // NO cargar si aún no hay overflow (evita auto-load)
        const hasOverflow = rootEl.scrollHeight > rootEl.clientHeight;
        if (!hasOverflow) return;

        if (loadingMoreRef.current) return;
        if (isValidating) return;
        if (!hasMore) return;

        loadingMoreRef.current = true;
        setSize((prev) => prev + 1);
      },
      {
        root: rootEl,
        threshold: 0,
        rootMargin: "120px 0px",
      }
    );

    ioRef.current.observe(targetEl);

    return () => {
      ioRef.current?.disconnect();
      ioRef.current = null;
    };
  }, [data, hasMore, isValidating, setSize]);

  const handleChangeEstado = (registroId: number, nuevoEstado: string) => {
    startTransition(async () => {
      const res = await updateRegistroEstado(registroId, nuevoEstado);
      if (!res?.success) return;
      await mutate();
    });
  };

  if (isLoading && size === 1) {
    return (
      <LoadingProgress
        fullscreen
        label="Cargando registros"
        description="Esto suele tardar solo unos segundos..."
      />
    );
  }

  if (error) {
    return (
      <div className="mt-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <CrmDashboard
        userId={userId}
        registros={registros}
        onChangeEstado={handleChangeEstado}
        sentinelRef={sentinelRef}
        onScrollRootReady={handleScrollRootReady}
      />
    </div>
  );
};