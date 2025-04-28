"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import { getSessionsByUserId, getSessionsCountByUserId, searchSessionsByUserId } from "@/actions/session-action";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, Database, XCircle } from "lucide-react";
import { UserSessionsSkeleton } from "./user-sessions-skeleton";
import { columns } from "./Columns";
import { DataTable } from "./data-table";

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
  const [searchResults, setSearchResults] = useState<Session[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
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

  const sessions = useMemo(() => {
    if (search.trim() !== "" && searchResults !== null) {
      return searchResults;
    }
    return data ? data.flat() : [];
  }, [data, searchResults, search]);

  const hasMore = !data || (data[data.length - 1]?.length === PAGE_SIZE);

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
    if (!observerRef.current || search.trim() !== "") return;

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !isValidating && hasMore && sessions.length > 0) {
        setSize((prev) => prev + 1);
      }
    }, { threshold: 1.0 });

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [isValidating, hasMore, sessions.length, search, setSize]);

  useEffect(() => {
    const interval = setInterval(() => {
      mutate();
    }, 30000);

    return () => clearInterval(interval);
  }, [mutate]);

  const handleDeleteFromTable = (deletedId: number) => {
    mutate((currentData) => {
      if (!currentData) return currentData;
      return currentData.map(page => page.filter(session => session.id !== deletedId));
    }, false);
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);

    if (value.trim().length === 0) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const res = await searchSessionsByUserId(userId, value);
      if (res.success) {
        setSearchResults(res.data || []);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Error buscando sesiones:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  if (isLoading && size === 1 && !search) return <UserSessionsSkeleton />;

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

  const hasResults = sessions.length > 0;

  if (!isLoading && !isSearching && !hasResults) {
    return (
      <div className="flex flex-col items-center justify-center mt-10 space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No se encontraron resultados</AlertTitle>
          <AlertDescription>Intenta buscar otro nombre o número.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
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
        <div className="py-2">
          <Input
            placeholder="Buscar por nombre o número..."
            value={search}
            onChange={handleSearchChange}
            className="w-full sm:max-w-sm"
          />
        </div>

        <DataTable columns={columns({ onDeleteSuccess: handleDeleteFromTable, mutateSessions: mutate })} data={sessions} />
      </Card>

      {isValidating && !search && (
        <div className="flex justify-center py-4">
          <Skeleton className="h-6 w-[200px]" />
        </div>
      )}

      {!search && hasResults && (
        <div ref={observerRef} className="h-10" />
      )}
    </>
  );
}
