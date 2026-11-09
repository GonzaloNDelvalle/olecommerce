"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/auth";

/**
 * Cliente de Better Auth para componentes del navegador (login, registro,
 * recuperación de contraseña). Llama a /api/auth/*, donde aplica el límite
 * de intentos.
 */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
