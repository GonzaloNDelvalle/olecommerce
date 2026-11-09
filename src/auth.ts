import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import {
  sendAccountExistsEmail,
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
} from "@/lib/email";

const appUrl = getAppUrl();

/**
 * Autenticación de clientas y administración con Better Auth.
 *
 * - Email + contraseña con verificación obligatoria del email.
 * - Recuperación de contraseña. Una compradora invitada que se quiere registrar
 *   recibe un link para crear su contraseña (así nadie "reclama" su historial).
 * - Sesiones en base de datos (revocables) con caché en cookie de 5 minutos.
 * - Límite de intentos persistido en Postgres (funciona en serverless).
 *
 * Las contraseñas migradas desde Auth.js están en bcrypt y se siguen
 * validando; las nuevas se guardan con scrypt (default de Better Auth).
 */
export const auth = betterAuth({
  appName: "OL. Indumenti",
  baseURL: appUrl,
  trustedOrigins: [appUrl],
  database: prismaAdapter(db, { provider: "postgresql" }),
  advanced: {
    database: { generateId: "uuid" },
  },

  user: {
    additionalFields: {
      firstName: { type: "string", required: true },
      lastName: { type: "string", required: true },
      documentNumber: { type: "string", required: false },
      phone: { type: "string", required: false },
      role: {
        type: "string",
        required: false,
        input: false,
        defaultValue: "CUSTOMER",
      },
      isActive: {
        type: "boolean",
        required: false,
        input: false,
        defaultValue: true,
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 días
    updateAge: 60 * 60 * 24, // renueva la expiración una vez por día de uso
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    minPasswordLength: 8,
    maxPasswordLength: 72,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hora
    password: {
      hash: (password) => hashPassword(password),
      verify: async ({ hash, password }) =>
        hash.startsWith("$2")
          ? bcrypt.compare(password, hash) // contraseñas heredadas de Auth.js
          : verifyPassword({ hash, password }),
    },
    sendResetPassword: async ({ user, token }) => {
      const credential = await db.account.findFirst({
        where: { userId: user.id, providerId: "credential" },
        select: { id: true },
      });
      await sendPasswordResetEmail({
        to: user.email,
        firstName: (user as { firstName?: string }).firstName ?? user.name,
        resetUrl: `${appUrl}/restablecer-contrasena?token=${encodeURIComponent(token)}`,
        isFirstPassword: !credential,
      });
    },
    // Abrir el link del email demuestra que la casilla es suya
    onPasswordReset: async ({ user }) => {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    },
    // Registro con un email que ya existe: la respuesta es genérica (no revela
    // si el email está registrado) y se avisa por correo a la dueña real.
    onExistingUserSignUp: async ({ user }) => {
      const credential = await db.account.findFirst({
        where: { userId: user.id, providerId: "credential" },
        select: { id: true },
      });
      if (!credential) {
        // Compró como invitada: se le envía el link para crear su contraseña
        await auth.api.requestPasswordReset({ body: { email: user.email } });
        return;
      }
      await sendAccountExistsEmail({
        to: user.email,
        loginUrl: `${appUrl}/login`,
        resetUrl: `${appUrl}/recuperar-contrasena`,
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24, // 24 horas
    sendVerificationEmail: async ({ user, token }) => {
      // El link lleva a una página con un botón (no verifica al abrirse), para
      // que los escáneres de seguridad de los correos no activen cuentas solos.
      await sendEmailVerificationEmail({
        to: user.email,
        firstName: (user as { firstName?: string }).firstName ?? user.name,
        verifyUrl: `${appUrl}/verificar-email?token=${encodeURIComponent(token)}`,
      });
    },
  },

  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60 * 10, max: 5 },
      "/request-password-reset": { window: 60 * 10, max: 3 },
      "/send-verification-email": { window: 60 * 10, max: 3 },
      "/reset-password": { window: 60 * 10, max: 5 },
    },
  },

  databaseHooks: {
    session: {
      create: {
        // Cuentas desactivadas desde el admin no pueden iniciar sesión
        before: async (session) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { isActive: true },
          });
          if (!user?.isActive) return false;
        },
      },
    },
  },

  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;

/**
 * Sesión actual desde un Server Component, Server Action o Route Handler.
 */
export async function getSession(): Promise<AuthSession | null> {
  return auth.api.getSession({ headers: await headers() });
}
