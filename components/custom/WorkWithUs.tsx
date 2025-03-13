import { Briefcase, Bot, DatabaseZap, Image, Mic, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    name: "Atención 24/7 Automatizada",
    description:
      "Ofrece respuestas rápidas y personalizadas, incluso fuera del horario laboral. Mantén la atención al cliente siempre activa sin límites.",
    icon: Bot,
  },
  {
    name: "Interpretación de Audios e Imágenes",
    description:
      "Tu asistente IA comprende notas de voz y analiza imágenes para validar pagos o identificar productos de tu catálogo.",
    icon: Mic,
  },
  {
    name: "Memoria y Aprendizaje Continuo",
    description:
      "Conserva el contexto de las conversaciones y aprende en cada interacción para brindar respuestas más precisas y personalizadas.",
    icon: ShieldCheck,
  },
  {
    name: "Conexión con Bases de Datos y CRMs",
    description:
      "Accede y actualiza datos en tiempo real desde Google Sheets, Woocommerce, CRMs y APIs, garantizando una gestión eficiente de información.",
    icon: DatabaseZap,
  },
  {
    name: "Envío Multimedia y Respuestas Rápidas",
    description:
      "Envía mensajes, imágenes, documentos, videos y productos desde tu catálogo. Respuestas rápidas y eficientes para mejorar la experiencia.",
    icon: Image,
  },
  {
    name: "Automatización de Procesos y Seguimiento",
    description:
      "Automatiza tareas repetitivas, gestiona embudos de ventas y realiza seguimientos automáticos para aumentar tus oportunidades de cierre.",
    icon: Briefcase,
  },
];

export const WorkWithUs = () => {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
            Impulsa tu negocio con Verzay
          </h2>
          <p className="mt-4 text-4xl font-bold text-gray-900">
            Automatización de ventas y atención al cliente con IA
          </p>
          <p className="mt-4 text-lg text-muted-foreground">
            Optimiza tus procesos, mejora la atención al cliente y aumenta tus ventas con nuestras soluciones inteligentes.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.name} className="flex flex-col justify-start p-6 hover:shadow-xl transition">
              <CardContent className="flex flex-col items-start p-0">
                <div className="flex items-center justify-center rounded-full bg-indigo-600 p-3 mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkWithUs;