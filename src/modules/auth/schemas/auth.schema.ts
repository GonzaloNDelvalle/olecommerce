import { z } from "zod";

export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Ingresá tu correo electrónico")
    .email("Ingresá un correo electrónico válido"),
  password: z
    .string()
    .min(1, "Ingresá tu contraseña"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100),
    lastName: z
      .string()
      .trim()
      .min(2, "El apellido debe tener al menos 2 caracteres")
      .max(100),
    email: z
      .string()
      .trim()
      .min(1, "El correo electrónico es obligatorio")
      .email("Ingresá un correo electrónico válido"),
    documentNumber: z
      .string()
      .trim()
      .regex(
        /^\d{7,11}$/,
        "Ingresá un DNI o CUIT válido (7 a 11 números sin puntos)"
      )
      .optional()
      .or(z.literal("")),
    phone: z
      .string()
      .trim()
      .max(30)
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .max(72, "La contraseña no puede superar los 72 caracteres"),
    confirmPassword: z
      .string()
      .min(1, "Confirmá tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerFormSchema>;
