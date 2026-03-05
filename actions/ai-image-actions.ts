"use server";

import OpenAI, { toFile } from "openai";
import { currentUser } from "@/lib/auth";

type AdFormat = "1:1" | "9:16" | "16:9";

const TEMPLATE_INSTRUCTIONS: Record<string, string> = {
  hero: "Composicion de alto impacto con el producto como protagonista. Deja espacio para titulo y CTA.",
  pain: "Escena que comunica el problema del cliente y el producto como solucion.",
  solution: "Presenta el producto con claridad y beneficios principales.",
  benefits: "Muestra transformacion positiva y resultado final.",
  social: "Escena autentica con prueba social y uso real.",
  demo: "Escena tipo demostracion con claridad de uso.",
  objections: "Composicion que transmita confianza, garantia y seguridad.",
  offer: "Composicion orientada a oferta, descuento y valor.",
  cta: "Urgencia y llamado a la accion fuerte.",
  trust: "Cierre institucional con confianza de marca.",
};

function mapAspectRatioToSize(format: AdFormat): "1024x1024" | "1024x1536" | "1536x1024" {
  if (format === "9:16") return "1024x1536";
  if (format === "16:9") return "1536x1024";
  return "1024x1024";
}

function stripDataUrlPrefix(dataUrl: string): string {
  const idx = dataUrl.indexOf(",");
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
}

export async function generateAiImageAction(input: {
  sourceImage: string;
  style: string;
  customPrompt: string;
  template: string;
  aspectRatio: AdFormat;
  visualDNA: string;
  includeText: boolean;
}): Promise<{ success: boolean; image?: string; message: string }> {
  const user = await currentUser();
  if (!user) {
    return { success: false, message: "No autorizado." };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      success: false,
      message: "OPENAI_API_KEY no esta configurada en el servidor.",
    };
  }

  try {
    if (!input?.sourceImage || !input?.aspectRatio) {
      return { success: false, message: "Faltan datos requeridos para generar la imagen." };
    }

    const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const size = mapAspectRatioToSize(input.aspectRatio);
    const templateInstruction =
      TEMPLATE_INSTRUCTIONS[input.template || ""] ??
      "Composicion publicitaria profesional y equilibrada.";
    const textRule = input.includeText
      ? "Incluye texto publicitario profesional en espanol con CTA claro y precio."
      : "No incluyas texto, letras, logos ni marcas de agua.";

    const prompt = [
      "Genera una pieza publicitaria de alta conversion manteniendo fidelidad del producto de entrada.",
      `ADN visual: ${input.visualDNA || "Estudio profesional limpio."}`,
      `Estructura marketing: ${templateInstruction}`,
      `Estilo visual: ${input.style || "Minimalista."}`,
      `Detalles especificos: ${input.customPrompt || "Sin detalles extra."}`,
      `Formato objetivo: ${input.aspectRatio}.`,
      textRule,
      "Iluminacion cinematografica, alta nitidez, composicion premium.",
    ].join("\n");

    const base64Image = stripDataUrlPrefix(input.sourceImage);
    const imageBuffer = Buffer.from(base64Image, "base64");
    const imageFile = await toFile(imageBuffer, "product.png", {
      type: "image/png",
    });

    const response = await ai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt,
      size,
    });

    const result = response.data?.[0];
    if (!result) {
      return { success: false, message: "El modelo no devolvio resultados." };
    }

    if (result.b64_json) {
      return {
        success: true,
        image: `data:image/png;base64,${result.b64_json}`,
        message: "Imagen generada correctamente.",
      };
    }

    if (result.url) {
      return { success: true, image: result.url, message: "Imagen generada correctamente." };
    }

    return { success: false, message: "El modelo no devolvio imagen utilizable." };
  } catch (error: any) {
    console.error("[AI_IMAGE_ACTION_ERROR]", error);
    return { success: false, message: error?.message || "Error al generar la imagen." };
  }
}

