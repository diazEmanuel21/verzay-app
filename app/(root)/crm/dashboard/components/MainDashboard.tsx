// app/(dashboard)/crm/dashboard/components/MainDashboard.tsx
"use client";

import { useEffect, useMemo, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import useSWRInfinite from "swr/infinite";

import { CrmDashboard } from "./CrmDashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getRegistrosByUserId, updateRegistroEstado } from "@/actions/crm-seed-actions";
import { LoadingProgress } from "@/components/shared/LoadingProgress";
import { RegistroWithSession } from "@/types/session";

type MainDashboardProps = {
  userId: string;
};

const PAGE_SIZE = 50;

export const MainDashboard = ({ userId }: MainDashboardProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const observerRef = useRef<HTMLDivElement | null>(null);

  const getKey = (
    pageIndex: number,
    previousPageData: RegistroWithSession[] | null
  ) => {
    // si la página anterior viene con menos de PAGE_SIZE, ya no hay más
    if (previousPageData && previousPageData.length < PAGE_SIZE) return null;
    return `${userId}-${pageIndex}`;
  };

  const {
    data,
    size,
    setSize,
    mutate,
    isLoading,
    isValidating,
    error,
  } = useSWRInfinite<RegistroWithSession[]>(
    getKey,
    async (key: string) => {
      const [, pageIndex] = key.split("-");
      const page = parseInt(pageIndex, 10);

      const res = await getRegistrosByUserId(
        userId,
        page * PAGE_SIZE,
        PAGE_SIZE
      );

      if (!res.success) {
        throw new Error(res.message || "No se pudieron cargar los registros");
      }

      return res.data || [];
    },
    {
      revalidateAll: false,
      revalidateFirstPage: false,
    }
  );

  const registros = useMemo(
    () => (data ? data.flat() : []),
    [data]
  );

  const hasMore =
    !data || (data[data.length - 1]?.length === PAGE_SIZE);

  // Infinite scroll con IntersectionObserver (igual patrón que SessionsContent)
  useEffect(() => {
    if (!observerRef.current) return;
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isValidating && hasMore) {
          setSize((prev) => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [hasMore, isValidating, setSize]);

  const handleChangeEstado = (registroId: number, nuevoEstado: string) => {
    startTransition(async () => {
      const res = await updateRegistroEstado(registroId, nuevoEstado);

      // aquí podrías usar toast según res.success
      if (!res?.success) {
        // opcional: mostrar error
        return;
      }

      // Revalidamos la lista sin recargar toda la página
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
          <AlertDescription>
            {(error as Error).message}
          </AlertDescription>
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
      />

      {/* Sentinel para infinite scroll */}
      {hasMore && <div ref={observerRef} className="h-10" />}

      {isValidating && (
        <p className="mt-2 text-xs text-muted-foreground">
          <LoadingProgress
            fullscreen
            label="  Cargando más registros..."
            description="Esto suele tardar solo unos segundos..."
          />
        </p>
      )}
    </div>
  );
};
