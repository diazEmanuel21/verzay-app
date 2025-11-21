"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CrmDashboard, RegistroWithSession } from "./CrmDashboard";
import { updateRegistroEstado } from "@/actions/crm-seed-actions";
// si usas toasts, aquí también importarías tu hook de toast

export const MainDashboard = ({
  registros,
}: {
  registros: RegistroWithSession[];
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleChangeEstado = (registroId: string, nuevoEstado: string) => {
    startTransition(async () => {
      const res = await updateRegistroEstado(registroId, nuevoEstado);

      // TODO: aquí puedes meter toast de éxito / error
      // if (!res.success) toast({ ... })

      // refrescamos datos del servidor
      router.refresh();
    });
  };

  return (
    <CrmDashboard
      registros={registros}
      onChangeEstado={handleChangeEstado}
    />
  );
};
