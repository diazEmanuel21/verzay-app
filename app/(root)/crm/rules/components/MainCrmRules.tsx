import { useCallback } from "react";
import { CrmFollowUpRulesPanel } from "./CrmFollowUpRulesPanel"
import { LoadingProgress } from "@/components/shared/LoadingProgress";
import { getCrmDashboardStatsByUserId } from "@/actions/registro-action";
import useSWRInfinite from "swr/infinite";
import { RegistroWithSession } from "@/types/session";

export const MainCrmRules = ({ userId }: { userId: string }) => {

    const refreshStats = useCallback(async () => {
        const res = await getCrmDashboardStatsByUserId(userId);
        if (res.success) setStats(res.data);
    }, [userId]);

  const { data, size, setSize, mutate, isLoading, isValidating, error } =
    useSWRInfinite<RegistroWithSession[]>(
      getKey,
      async (key: string) => {
        const payload = JSON.parse(key) as CrmPageKeyPayload;
        const tipo = payload.activeTab === "TODOS" ? undefined : payload.activeTab;

        const res = await getRegistrosByUserId(
          payload.userId,
          payload.pageIndex * PAGE_SIZE,
          PAGE_SIZE,
          tipo,
          payload.filters
        );

        if (!res.success) throw new Error(res.message || "No se pudieron cargar los registros");
        return res.data || [];
      },
      { revalidateAll: false, revalidateFirstPage: false }
    );


    const handleFollowUpChanged = useCallback(async () => {
        await mutate();
        await refreshStats();
    }, [mutate, refreshStats]);

    if (isLoading && size === 1) {
        return (
            <LoadingProgress
                fullscreen
                label="Cargando registros"
                description="Esto suele tardar solo unos segundos..."
            />
        );
    }

    return (
        <CrmFollowUpRulesPanel
            userId={userId}
            onUpdated={handleFollowUpChanged}
        />
    )
}
