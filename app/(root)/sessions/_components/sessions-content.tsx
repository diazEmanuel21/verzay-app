"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWRInfinite from "swr/infinite";
import { activateAllSessions, deactivateAllSessions, deleteAllSessions, getSessionsByUserId, getSessionsCountByUserId, searchSessionsByUserId } from "@/actions/session-action";
import { clearAllHistory } from "@/actions/n8n-chat-historial-action";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, Database, XCircle } from "lucide-react";
import { UserSessionsSkeleton } from "./user-sessions-skeleton";
import { columns } from "./Columns";
import { DataTable } from "./data-table";
import { BulkActionsDropdown } from "./BulkActionsDropdown";
import { cn } from "@/lib/utils";

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
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<{ total: number; active: number; inactive: number } | null>(null);
  const [searchResults, setSearchResults] = useState<Session[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const getKey = (pageIndex: number, previousPageData: Session[] | null) => {
    if (previousPageData && previousPageData.length < PAGE_SIZE) return null;
    return `${userId}-${pageIndex}-${filter}`;
  };

  const { data, size, setSize, mutate, isLoading, isValidating, error } = useSWRInfinite<Session[]>(
    getKey,
    async (key: string) => {
      const [userId, pageIndex, filter] = key.split("-");
      const page = parseInt(pageIndex, 10);
      const status = filter === "active" ? true : filter === "inactive" ? false : undefined;


      const response = await getSessionsByUserId(userId, page * PAGE_SIZE, PAGE_SIZE, status);
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

  // if (!isLoading && !isSearching && !hasResults) {
  //   return (
  //     <div className="flex flex-col items-center justify-center mt-10 space-y-4">
  //       <Alert>
  //         <AlertCircle className="h-4 w-4" />
  //         <AlertTitle>No se encontraron resultados</AlertTitle>
  //         <AlertDescription>Intenta buscar otro nombre o número.</AlertDescription>
  //       </Alert>
  //     </div>
  //   );
  // }

  const cardStats = [
    {
      key: "all",
      title: "Total",
      icon: <Database className="h-4 w-4 text-gray-500" />,
      value: stats?.total,
      description: "Leads en total",
      color: "",
      progress: null,
    },
    {
      key: "active",
      title: "Activos",
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      value: stats?.active,
      description: stats?.total ? `${Math.round((stats.active / stats.total) * 100)}% del total` : "0% del total",
      color: "text-green-600",
      progress: stats?.total ? (stats.active / stats.total) * 100 : 0,
    },
    {
      key: "inactive",
      title: "Inactivos",
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      value: stats?.inactive,
      description: stats?.total ? `${100 - Math.round((stats.active / stats.total) * 100)}% del total` : "0% del total",
      color: "text-red-600",
      progress: stats?.total ? 100 - (stats.active / stats.total) * 100 : 0,
    },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      {/* Header fijo */}
      <div className="sticky top-0 z-1">
        <div className="flex justify-between items-center">
          <div className="container-stats flex flex-1 gap-4 overflow-x-auto mb-2 p-2">
            {cardStats.map((card, idx) => {
              const isActive = filter === card.key;

              const bgColor =
                card.key === "all"
                  ? "bg-blue-600"
                  : card.key === "active"
                    ? "bg-green-600"
                    : "bg-red-600";

              return (
                <Card
                  key={idx}
                  onClick={() => {
                    setFilter(card.key);
                    setSize(1);
                  }}
                  className={cn(
                    "flex-1 min-w-[160px] cursor-pointer transition-all duration-300 ease-in-out rounded-xl border-none hover:shadow-lg hover:scale-[1.01]",
                    bgColor,
                    isActive ? "ring-2 ring-white" : "",
                    "text-white"
                  )}
                >
                  <CardContent className="py-3 px-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm sm:text-base font-semibold truncate">
                        {card.title}: {card.value}
                      </div>
                      <div className="text-white">
                        {card.key === "all" && <Database className="w-5 h-5" />}
                        {card.key === "active" && <CheckCircle2 className="w-5 h-5" />}
                        {card.key === "inactive" && <XCircle className="w-5 h-5" />}
                      </div>
                    </div>

                    {card.progress !== null && (
                      <Progress
                        value={card.progress}
                        className="h-2 bg-white/30"
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>


        </div>
        <div className="flex flex-1 justify-between p-2">
          <Input
            placeholder="Buscar por nombre o número..."
            value={search}
            onChange={handleSearchChange}
            className="w-full sm:max-w-sm text-xs"
          />
          <BulkActionsDropdown
            userId={userId}
            onActivateAll={activateAllSessions}
            onDeactivateAll={deactivateAllSessions}
            onDeleteAll={deleteAllSessions}
            onClearHistory={clearAllHistory}
            onSuccess={() => router.refresh()}
          />
        </div>
      </div>

      {/* Scroll interno para el contenido */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-1 gap-4">
          <Card className="border-border">
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
        </div>
      </div>
    </div>
  );
}
