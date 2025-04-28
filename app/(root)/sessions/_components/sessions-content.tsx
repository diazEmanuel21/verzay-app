"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import { getSessionsByUserId, getSessionsCountByUserId } from "@/actions/session-action";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, Database, XCircle } from "lucide-react";
import { UserSessionsSkeleton } from "./user-sessions-skeleton";
import { DataTable } from "../../(protected)/admin/clientes/_components/data-table";
import { columns } from "./Columns";

interface SessionsContentProps {
  userId: string;
}

type Session = {
  id: number;
  userId: string;
  remoteJid: string;
  pushName: string;
  instanceId: string;
  createdAt: Date;
  updatedAt: Date;
  status: boolean;
};

const PAGE_SIZE = 20;

export function SessionsContent({ userId }: SessionsContentProps) {
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<{ total: number; active: number; inactive: number } | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  const getKey = (pageIndex: number, previousPageData: Session[] | null) => {
    if (previousPageData && previousPageData.length < PAGE_SIZE) return null;
    return `${userId}-${pageIndex}`;
  };

  const { data, size, setSize, mutate, isLoading, isValidating, error } = useSWRInfinite<Session[]>(
    getKey,
    async (key: string) => {
      const [userId, pageIndex] = key.split("-");
      const page = parseInt(pageIndex, 10);
      const response = await getSessionsByUserId(userId, page * PAGE_SIZE, PAGE_SIZE);
      if (!response.success) throw new Error(response.message);
      return response.data || [];
    },
    {
      revalidateAll: false,
      revalidateFirstPage: false,
    }
  );

  const sessions = data ? data.flat() : [];

  const filteredSessions = useMemo(() => {
    const query = search.toLowerCase();
    return sessions.filter(
      (session) =>
        session.pushName?.toLowerCase().includes(query) || session.remoteJid?.toLowerCase().includes(query)
    );
  }, [sessions, search]);

  useEffect(() => {
    async function fetchStats() {
      const res = await getSessionsCountByUserId(userId);
      if (res.success && res.data) {
        setStats(res.data);
      }
    }
    fetchStats();
  }, [userId]);

  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !isValidating) {
        setSize(size + 1);
      }
    }, { threshold: 1.0 });

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [size, isValidating]);

  // ⏰ Agregado: Revalidar automáticamente cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      mutate();
    }, 30000); // Cada 30 segundos (puedes poner 15000 para 15 segundos)

    return () => clearInterval(interval);
  }, [mutate]);
  // ⏰ Fin de agregado

  const handleDeleteFromTable = (deletedId: number) => {
    mutate((currentData) => {
      if (!currentData) return currentData;
      return currentData.map(page => page.filter(session => session.id !== deletedId));
    }, false);
  };

  if (isLoading && size === 1) return <UserSessionsSkeleton />;

  if (error) {
    return (
      <div className="flex justify-center mt-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex justify-center mt-10">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No hay sesiones registradas</AlertTitle>
          <AlertDescription>Aún no tienes sesiones activas en el sistema.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      {/* Cards de estadísticas */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Leads</CardTitle>
            <Database className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            {stats ? (
              <>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Leads en total</p>
              </>
            ) : (
              <Skeleton className="h-8 w-24" />
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads Activos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {stats ? (
              <>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <p className="text-xs text-muted-foreground">{stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% del total</p>
                <Progress value={stats.total > 0 ? (stats.active / stats.total) * 100 : 0} className="h-2 mt-2" />
              </>
            ) : (
              <Skeleton className="h-8 w-24" />
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads Inactivos</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {stats ? (
              <>
                <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
                <p className="text-xs text-muted-foreground">{stats.total > 0 ? 100 - Math.round((stats.active / stats.total) * 100) : 0}% del total</p>
                <Progress value={stats.total > 0 ? 100 - (stats.active / stats.total) * 100 : 0} className="h-2 mt-2" />
              </>
            ) : (
              <Skeleton className="h-8 w-24" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="p-6">
        {/* Buscador */}
        <div className="py-2">
          <Input
            placeholder="Buscar por nombre o número..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-sm"
          />
        </div>

        {/* DataTable */}
        <DataTable columns={columns({ onDeleteSuccess: handleDeleteFromTable })} data={filteredSessions} />
      </Card>

      {isValidating && (
        <div className="flex justify-center py-4">
          <Skeleton className="h-6 w-[200px]" />
        </div>
      )}

      <div ref={observerRef} className="h-10" />
    </>
  );
}
