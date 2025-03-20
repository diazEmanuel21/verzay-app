import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

import FormInstance from "@/components/form-Instance";
import QRCodeGenerator from "@/components/form-qr";
import EnableToggleButton from "@/components/button-bot";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await currentUser();

  const user = await db.user.findUnique({
    where: { email: session?.email ?? "" },
  });

  if (!user) {
    return <div>No estás autenticado</div>;
  }

  return (
    <div className="flex flex-col justify-center items-center">
      <Card className="max-w-[600px]">
        <CardContent className="flex flex-col">
          {/* Contenedor para el formulario */}
          <div className="flex flex-col w-full">
            <FormInstance userId={user.id} />
          </div>

          {/* Contenedor horizontal para QR y botón de toggle */}
          <div className="flex flex-row  justify-between items-center gap-2">

            {/* QR Generator */}
            <div className="flex-1">
              <QRCodeGenerator userId={user.id} />
            </div>

            {/* Enable Toggle Button */}
            <div className="flex-1 flex justify-end">
              <EnableToggleButton userId={user.id} userName={user.name} />
            </div>

          </div>

        </CardContent>
      </Card>
    </div>
  );
}
