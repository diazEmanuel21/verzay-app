"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import useSWRInfinite from "swr/infinite";

import { CrmDashboard } from "./CrmDashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getCrmDashboardStatsByUserId, getRegistrosByUserId, RegistrosFilters, updateRegistroEstado } from "@/actions/registro-action";
import { LoadingProgress } from "@/components/shared/LoadingProgress";
import { RegistroWithSession, TipoRegistro } from "@/types/session";

export type MainDashboardProps = { userId: string };
export type DashboardStats = {
  totalRegistros: number;
  leadsConMovimientos: number;
  countsByTipo: Record<TipoRegistro, number>;
  chartDataByDay: { fecha: string; cantidad: number }[];
};

const PAGE_SIZE = 50;

export const MainDashboard = ({ userId }: MainDashboardProps) => {
  const [activeTab, setActiveTab] = useState<"TODOS" | TipoRegistro>("TODOS");
  const [filters, setFilters] = useState<RegistrosFilters>({});
  const [isPending, startTransition] = useTransition();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [scrollRootEl, setScrollRootEl] = useState<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const ioRef = useRef<IntersectionObserver | null>(null);

  const getKey = (pageIndex: number, previousPageData: RegistroWithSession[] | null) => {
    if (previousPageData && previousPageData.length < PAGE_SIZE) return null;
    return `crm:${userId}:${activeTab}:${filters.estado ?? ""}:${filters.fechaDesde ?? ""}:${filters.fechaHasta ?? ""}:${pageIndex}`;
  };

  const { data, size, setSize, mutate, isLoading, isValidating, error } =
    useSWRInfinite<RegistroWithSession[]>(
      getKey,
      async (key: string) => {
        const parts = key.split(":");
        const pageIndexRaw = parts[parts.length - 1] ?? "0";
        const toRaw = parts[parts.length - 2] ?? "";
        const fromRaw = parts[parts.length - 3] ?? "";
        const estadoRaw = parts[parts.length - 4] ?? "";
        const tabRaw = parts[parts.length - 5] as "TODOS" | TipoRegistro;
        const page = parseInt(pageIndexRaw, 10);
        const tipo = tabRaw === "TODOS" ? undefined : tabRaw;
        const serverFilters: RegistrosFilters = {
          ...(estadoRaw ? { estado: estadoRaw } : {}),
          ...(fromRaw ? { fechaDesde: fromRaw } : {}),
          ...(toRaw ? { fechaHasta: toRaw } : {}),
        };

        const res = await getRegistrosByUserId(userId, page * PAGE_SIZE, PAGE_SIZE, tipo, serverFilters);
        if (!res.success) throw new Error(res.message || "No se pudieron cargar los registros");
        return res.data || [];
      },
      { revalidateAll: false, revalidateFirstPage: false }
    );

  const registros = useMemo(() => (data ? data.flat() : []), [data]);
  const hasMore = !data || (data[data.length - 1]?.length === PAGE_SIZE);

  const handleScrollRootReady = useCallback((el: HTMLDivElement | null) => {
    setScrollRootEl(el);
  }, []);

  const refreshStats = useCallback(async () => {
    const res = await getCrmDashboardStatsByUserId(userId);
    if (res.success) setStats(res.data);
  }, [userId]);


  // libera lock al terminar
  useEffect(() => {
    if (!isValidating) loadingMoreRef.current = false;
  }, [isValidating]);

  // ÚNICO observer (aquí)
  useEffect(() => {
    const rootEl = scrollRootEl;
    const targetEl = sentinelRef.current;

    if (!rootEl || !targetEl) return;
    if (!data) return;
    if (!hasMore) return;

    ioRef.current?.disconnect();

    ioRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

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
  }, [scrollRootEl, data, hasMore, isValidating, setSize]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const handleChangeEstado = (registroId: number, nuevoEstado: string) => {
    startTransition(async () => {
      const res = await updateRegistroEstado(registroId, nuevoEstado);
      if (!res?.success) return;

      await mutate();
      await refreshStats(); // mantiene métricas perfectas
    });
  };

  const handleTabChange = useCallback((tab: "TODOS" | TipoRegistro) => {
    loadingMoreRef.current = false;
    setActiveTab(tab);
    setSize(1);
  }, [setSize]);

  const handleFiltersChange = useCallback((next: RegistrosFilters) => {
    loadingMoreRef.current = false;
    setFilters(next);
    setSize(1);
  }, [setSize]);

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
        stats={stats}
        userId={userId}
        activeTab={activeTab}
        onActiveTabChange={handleTabChange}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        registros={registros}
        onChangeEstado={handleChangeEstado}
        sentinelRef={sentinelRef}
        onScrollRootReady={handleScrollRootReady}
      />
    </div>
  );
};
