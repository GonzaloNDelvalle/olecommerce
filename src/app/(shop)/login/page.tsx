"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  loginFormSchema,
  type LoginFormValues,
} from "@/modules/auth/schemas/auth.schema";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { safeInternalPath } from "@/lib/safe-path";


import { INPUT_CLASS, LABEL_CLASS, SUBMIT_CLASS } from "@/components/ui/form";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeInternalPath(searchParams.get("callbackUrl"));

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);

    const { error } = await authClient.signIn.email({
      email: values.email.trim().toLowerCase(),
      password: values.password,
    });

    if (error) {
      setServerError(authErrorMessage(error));
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(44,33,25,0.06)] sm:p-9">
      {serverError && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-brick/30 bg-brick/5 p-4 text-sm text-brick">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brick" />
          <p>{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <div>
          <label htmlFor="email" className={LABEL_CLASS}>
            Correo Electrónico
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            {...register("email")}
            className={INPUT_CLASS}
          />
          {errors.email && (
            <p className="mt-1.5 text-[13px] font-medium text-brick">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className={LABEL_CLASS}>
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
            className={INPUT_CLASS}
          />
          {errors.password && (
            <p className="mt-1.5 text-[13px] font-medium text-brick">
              {errors.password.message}
            </p>
          )}
          <div className="mt-3 text-right">
            <Link
              href="/recuperar-contrasena"
              className="font-sans text-xs font-normal text-stone-500 underline-offset-4 hover:text-ink hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={SUBMIT_CLASS}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Ingresando…
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 border-t border-stone-200 pt-6 text-center font-sans text-xs font-normal text-stone-500">
        <span>¿Todavía no tenés una cuenta? </span>
        <Link
          href="/registro"
          className="border-b border-ink pb-0.5 text-ink uppercase tracking-[0.15em] text-xs transition-colors hover:border-stone-500 hover:text-stone-600"
        >
          Crear una cuenta
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-paper">
      <div className="mx-auto max-w-md px-4 py-20">
        <header className="mb-10 text-center">
          <h1 className="display mt-4 text-[clamp(40px,6vw,56px)] text-ink">
            Iniciar sesión
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[15px] text-stone-700">
            ACCESO DE CLIENTAS &amp; SEGUIMIENTO DE PEDIDOS
          </p>
        </header>

        <Suspense
          fallback={
            <div className="h-80 animate-pulse border border-stone-200 bg-white" />
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
