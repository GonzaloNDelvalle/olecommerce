"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import {
  AUTH_BUTTON_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AuthAlert,
  AuthShell,
} from "@/modules/auth/components/AuthShell";

const schema = z.object({
  email: z.string().trim().email("Ingresá un correo electrónico válido"),
});

type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: Values) {
    setServerError(null);
    const { error } = await authClient.requestPasswordReset({
      email: values.email.toLowerCase(),
      redirectTo: "/restablecer-contrasena",
    });
    if (error) {
      setServerError(authErrorMessage(error));
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell
      title="Recuperar contraseña"
      subtitle="Te enviamos un link por email"
    >
      {sent ? (
        <AuthAlert tone="success">
          Si el email está registrado, en unos minutos vas a recibir un link
          para elegir una nueva contraseña. Revisá también la carpeta de spam.
        </AuthAlert>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-6"
        >
          {serverError && <AuthAlert tone="error">{serverError}</AuthAlert>}
          <div>
            <label htmlFor="email" className={AUTH_LABEL_CLASS}>
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              {...register("email")}
              className={AUTH_INPUT_CLASS}
            />
            {errors.email && (
              <p className="mt-1.5 font-sans text-xs font-normal text-brick">
                {errors.email.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={AUTH_BUTTON_CLASS}
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isSubmitting ? "ENVIANDO..." : "ENVIAR LINK"}
          </button>
        </form>
      )}
      <div className="mt-8 border-t border-stone-200 pt-6 text-center">
        <Link
          href="/login"
          className="border-b border-ink pb-0.5 font-sans text-xs tracking-[0.15em] text-ink uppercase"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    </AuthShell>
  );
}
