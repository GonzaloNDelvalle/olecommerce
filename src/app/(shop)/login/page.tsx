"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, ArrowRight } from "lucide-react";
import {
  loginFormSchema,
  type LoginFormValues,
} from "@/modules/auth/schemas/auth.schema";
import { loginCustomerAction } from "@/modules/auth/actions/auth.actions";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/mi-cuenta";

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

    const result = await loginCustomerAction(values);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8">
      {serverError && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p>{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium text-stone-700"
          >
            Correo Electrónico
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            {...register("email")}
            className="mt-1.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 transition-colors focus:border-stone-900 focus:bg-white focus:outline-none"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-medium text-stone-700"
          >
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
            className="mt-1.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 transition-colors focus:border-stone-900 focus:bg-white focus:outline-none"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-6 py-3.5 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Ingresando...
            </>
          ) : (
            <>
              Ingresar a Mi Cuenta
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-stone-200 pt-6 text-center text-xs text-stone-600">
        ¿Todavía no tenés cuenta en OLÉ?{" "}
        <Link
          href="/registro"
          className="font-semibold text-stone-900 underline underline-offset-4 hover:text-stone-600"
        >
          Creá tu cuenta aquí
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <header className="mb-8 text-center">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-stone-500 uppercase">
          Acceso de Clientas
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
          Iniciar Sesión
        </h1>
        <p className="mt-2 text-xs text-stone-500">
          Consultá el estado de tus pedidos, pagos por transferencia e historial
          de compras.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="h-72 animate-pulse rounded-xl border border-stone-200 bg-stone-50" />
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
