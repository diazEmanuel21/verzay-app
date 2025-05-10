import { object, string } from "zod";

export const loginSchema = object({
  email: string({ required_error: "Correo electronico requerido" }),
  // .min(1, "Correo electronico requerido")
  // .email("Correo electrónico no válido"),
  password: string({ required_error: "Password is required" })
    .min(1, "Contraseña es requerida")
    .min(6, "La contraseña debe tener más de 6 caracteres.")
    .max(32, "Password must be less than 32 characters"),
});

export const registerSchema = object({
  email: string({ required_error: "Correo electronico requerido" })
    .min(1, "Correo electronico requerido")
    .email("Correo electrónico no válido"),
  password: string({ required_error: "Password is required" })
    .min(1, "Contraseña es requerida")
    .min(6, "La contraseña debe tener más de 6 caracteres.")
    .max(32, "Password must be less than 32 characters"),
  name: string({ required_error: "Name is required" })
    .min(1, "Name is required")
    .max(32, "Name must be less than 32 characters"),
});

export const workflowShema = object({
  name: string().max(200),
  description: string().max(500),
});