"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, ArrowRight } from "lucide-react";
import {
  registerFormSchema,
  type RegisterFormValues,
} from "@/modules/auth/schemas/auth.schema";
import { registerCustomerAction } from "@/modules/auth/actions/auth.actions";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      documentNumber: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);

    const result = await registerCustomerAction(values);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    router.push("/mi-cuenta");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-14 sm:px-6">
      <header className="mb-8 text-center">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-stone-500 uppercase">
          Comunidad OLÉ
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
          Crear Cuenta
        </h1>
        <p className="mt-2 text-xs text-stone-500">
          Registrate para agilizar tus compras y hacer seguimiento de tus
          pedidos en tiempo real.
        </p>
      </header>

      <div className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8">
        {serverError && (
          <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <p>{serverError}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="firstName"
                className="block text-xs font-medium text-stone-700"
              >
                Nombre *
              </label>
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                {...register("firstName")}
                className="mt-1.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 transition-colors focus:border-stone-900 focus:bg-white focus:outline-none"
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-xs font-medium text-stone-700"
              >
                Apellido *
              </label>
              <input
                id="lastName"
                type="text"
                autoComplete="family-name"
                {...register("lastName")}
                className="mt-1.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 transition-colors focus:border-stone-900 focus:bg-white focus:outline-none"
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-stone-700"
            >
              Correo Electrónico *
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
              <p className="mt-1 text-xs text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="documentNumber"
                className="block text-xs font-medium text-stone-700"
              >
                DNI / CUIT (Opcional)
              </label>
              <input
                id="documentNumber"
                type="text"
                inputMode="numeric"
                placeholder="Ej: 38123456"
                {...register("documentNumber")}
                className="mt-1.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 transition-colors focus:border-stone-900 focus:bg-white focus:outline-none"
              />
              {errors.documentNumber && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.documentNumber.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-medium text-stone-700"
              >
                Teléfono / WhatsApp (Opcional)
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="Ej: 11 2345 6789"
                {...register("phone")}
                className="mt-1.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 transition-colors focus:border-stone-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-stone-700"
              >
                Contraseña *
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                {...register("password")}
                className="mt-1.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 transition-colors focus:border-stone-900 focus:bg-white focus:outline-none"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-medium text-stone-700"
              >
                Confirmar Contraseña *
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repetí tu contraseña"
                {...register("confirmPassword")}
                className="mt-1.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 transition-colors focus:border-stone-900 focus:bg-white focus:outline-none"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-6 py-3.5 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creando tu cuenta...
              </>
            ) : (
              <>
                Crear Cuenta
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-stone-200 pt-6 text-center text-xs text-stone-600">
          ¿Ya tenés una cuenta registrada?{" "}
          <Link
            href="/login"
            className="font-semibold text-stone-900 underline underline-offset-4 hover:text-stone-600"
          >
            Iniciá sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
