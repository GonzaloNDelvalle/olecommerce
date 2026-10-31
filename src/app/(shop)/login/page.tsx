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
import { loginCustomerAction } from "@/modules/auth/actions/auth.actions";

const INPUT_CLASS =
  "w-full bg-transparent border-0 border-b border-stone-300 focus:border-stone-900 rounded-none px-0 py-3 font-sans text-sm font-light text-stone-900 placeholder:text-stone-400 focus:outline-none transition-colors";
const LABEL_CLASS =
  "block font-sans text-[10px] uppercase tracking-[0.2em] text-stone-600";

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
    <div className="rounded-none border border-stone-200 bg-white p-8 sm:p-10">
      {serverError && (
        <div className="mb-6 flex items-start gap-2.5 rounded-none border border-red-200 bg-red-50/70 p-4 font-sans text-xs font-light text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
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
            <p className="mt-1.5 font-sans text-[11px] font-light text-red-600">
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
            <p className="mt-1.5 font-sans text-[11px] font-light text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-none bg-stone-900 px-6 font-sans text-xs tracking-[0.2em] text-white uppercase transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                INGRESANDO...
              </>
            ) : (
              "INICIAR SESIÓN"
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 border-t border-stone-200 pt-6 text-center font-sans text-xs font-light text-stone-500">
        <span>¿Todavía no tenés una cuenta? </span>
        <Link
          href="/registro"
          className="border-b border-stone-900 pb-0.5 text-stone-900 uppercase tracking-[0.15em] text-[11px] transition-colors hover:border-stone-500 hover:text-stone-600"
        >
          Crear una cuenta
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#FAF9F6]">
      <div className="mx-auto max-w-md px-4 py-20">
        <header className="mb-10 text-center">
          <p className="font-serif text-3xl tracking-tight text-stone-900">
            OL.
          </p>
          <h1 className="mt-4 font-serif text-3xl tracking-wide text-stone-900 uppercase">
            INICIAR SESIÓN
          </h1>
          <p className="mt-2.5 font-sans text-xs tracking-[0.2em] text-stone-500 uppercase">
            ACCESO DE CLIENTAS &amp; SEGUIMIENTO DE PEDIDOS
          </p>
        </header>

        <Suspense
          fallback={
            <div className="h-80 animate-pulse rounded-none border border-stone-200 bg-white" />
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
