import FormInstance from "@/components/form-Instance";
import QRCodeGenerator from "@/components/form-qr";
import EnableToggleButton from "@/components/button-bot";

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { FaWhatsapp } from 'react-icons/fa';
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";


export default async function DashboardPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col items-center min-h-screen">
      <Card className="max-w-[600px] relative">
        <CardContent className="flex flex-col">
          {/* Contenedor para el formulario */}
          <FormInstance userId={user.id} />

          {/* Contenedor horizontal para QR y botón de toggle */}
          <div className="flex flex-row  justify-between items-center gap-2">

            <a
              href="https://wa.me/1234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-lg transition"
            >
              <FaWhatsapp size={24} />
            </a>

            {/* QR Generator */}
            <div className="flex-1">
              <QRCodeGenerator userId={user.id} />
            </div>

            {/* Enable Toggle Button */}
            <div className="flex-1 flex justify-end">
              <EnableToggleButton userId={user.id} userName={user.name} apiurl={user.apiurl} apikey={user.apikey} />
            </div>

          </div>
        </CardContent>
        <CardFooter>
          <p className="pr-1 font-bold ">
            Whatsapp |
          </p>
          <p className="pr-1 text-gray-400">Business</p>
        </CardFooter>
      </Card>
    </div>
  );
}
