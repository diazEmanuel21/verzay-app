"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const plans = [
  {
    name: "PYMES",
    id: "plan-pymes",
    priceMonthly: 49.5,
    priceYearly: 39.6,
    description: "Ideal para pequeñas empresas que buscan automatizar sus procesos de atención al cliente.",
    features: [
      "Interpretación de audios",
      "Memoria contextual",
      "Toma de solicitudes y/o citas",
      "1 flujo por una línea WhatsApp",
      "Captura datos en tu WhatsApp",
      "Envía notificación a otro número",
    ],
    featured: false,
    href: "#",
  },
  {
    name: "BUSINESS",
    id: "plan-business",
    priceMonthly: 99.5,
    priceYearly: 74.6,
    description: "Para negocios en crecimiento que requieren mayor interacción y control de datos.",
    features: [
      "Interpretación de audios",
      "Envío de múltiples archivos",
      "Toma de solicitudes, pedidos o citas",
      "Respuestas rápidas y envío de archivos",
      "3 flujos en tu misma línea WhatsApp",
      "CRM Google Sheets para base de datos",
      "Captura y envía datos a Google Sheets",
    ],
    featured: true,
    href: "#",
  },
  {
    name: "EMPRESARIAL",
    id: "plan-empresarial",
    priceMonthly: 149.5,
    priceYearly: 104.6,
    description: "Solución integral para empresas que necesitan alto nivel de automatización y conexión con APIs.",
    features: [
      "Interpretación de audios",
      "Lectura de imágenes PNG y JPEG",
      "Respuestas rápidas con envío de archivos",
      "Captura y consulta a Google Sheets",
      "5 flujos en tu misma línea WhatsApp",
      "Seguimiento, recordatorios e inactividad",
      "Conexiones APIs, Wrls, Woocommerce",
    ],
    featured: false,
    href: "#",
  },
];

const CreditPage = () => {
  const [isYearly, setIsYearly] = useState(false);

  const handleToggle = (checked: boolean) => {
    setIsYearly(checked);
  };

  return (
    <>
      <div className="max-w-4xl mx-auto text-center">
        <p className="mt-4 text-4xl font-bold text-gray-900 dark:text-white">
          Elige el plan ideal para tu negocio
        </p>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          Automatiza tus ventas y atención al cliente con nuestras soluciones de inteligencia artificial. Planes flexibles para cada etapa de tu negocio.
        </p>

        {/* Toggle Switch */}
        <div className="flex items-center justify-center mt-8 space-x-4">
          <Label htmlFor="billing-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Mensual
          </Label>
          <Switch
            id="billing-toggle"
            checked={isYearly}
            onCheckedChange={handleToggle}
          />
          <Label htmlFor="billing-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Anual <span className="text-blue-600">(Hasta 30% OFF)</span>
          </Label>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3 max-w-7xl mx-auto">
        {plans.map((plan) => {
          const price = isYearly ? plan.priceYearly : plan.priceMonthly;
          const period = isYearly ? "/año" : "/mes";

          return (
            <Card
              key={plan.id}
              className={`flex flex-col justify-between shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors ${plan.featured ? "border-2 border-blue-600 dark:border-blue-500" : ""
                }`}
            >
              <CardHeader>
                <CardTitle className={`text-lg font-semibold ${plan.featured ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"
                  }`}>
                  {plan.name}
                </CardTitle>
                <div className="mt-4 flex items-baseline gap-x-2">
                  <span className={`text-5xl font-bold ${plan.featured ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"
                    }`}>
                    ${price.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{period}</span>
                </div>
              </CardHeader>

              <CardContent>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{plan.description}</p>
                <ul className="mt-6 space-y-4 text-sm text-gray-600 dark:text-gray-300">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-1" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.featured ? "default" : "outline"}
                  className={`w-full mt-8 transition-colors ${plan.featured
                      ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                      : "border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    }`}
                >
                  Empezar ahora
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
};

export default CreditPage;