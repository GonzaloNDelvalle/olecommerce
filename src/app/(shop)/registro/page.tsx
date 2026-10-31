"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  registerFormSchema,
  type RegisterFormValues,
} from "@/modules/auth/schemas/auth.schema";
import { registerCustomerAction } from "@/modules/auth/actions/auth.actions";

const INPUT_CLASS =
  "w-full bg-transparent border-0 border-b border-stone-300 focus:border-stone-900 rounded-none px-0 py-3 font-sans text-sm font-light text-stone-900 placeholder:text-stone-400 focus:outline-none transition-colors";
const LABEL_CLASS =
  "block font-sans text-[10px] uppercase tracking-[0.2em] text-stone-600";

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
    <main className="min-h-[calc(100vh-5rem)] bg-[#FAF9F6]">
      <div className="mx-auto max-w-md px-4 py-20">
        <header className="mb-10 text-center">
          <p className="font-serif text-3xl tracking-tight text-stone-900">
            OL.
          </p>
          <h1 className="mt-4 font-serif text-3xl tracking-wide text-stone-900 uppercase">
            CREAR CUENTA
          </h1>
          <p className="mt-2.5 font-sans text-xs tracking-[0.2em] text-stone-500 uppercase">
            ESPACIO PERSONAL &amp; SEGUIMIENTO DE ENVÍOS
          </p>
        </header>

        <div className="rounded-none border border-stone-200 bg-white p-8 sm:p-10">
          {serverError && (
            <div className="mb-6 flex items-start gap-2.5 rounded-none border border-red-200 bg-red-50/70 p-4 font-sans text-xs font-light text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
              <p>{serverError}</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className={LABEL_CLASS}>
                  Nombre *
                </label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Tu nombre"
                  {...register("firstName")}
                  className={INPUT_CLASS}
                />
                {errors.firstName && (
                  <p className="mt-1.5 font-sans text-[11px] font-light text-red-600">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className={LABEL_CLASS}>
                  Apellido *
                </label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Tu apellido"
                  {...register("lastName")}
                  className={INPUT_CLASS}
                />
                {errors.lastName && (
                  <p className="mt-1.5 font-sans text-[11px] font-light text-red-600">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className={LABEL_CLASS}>
                Correo Electrónico *
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

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="documentNumber" className={LABEL_CLASS}>
                  DNI / CUIT (Opcional)
                </label>
                <input
                  id="documentNumber"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej: 38123456"
                  {...register("documentNumber")}
                  className={INPUT_CLASS}
                />
                {errors.documentNumber && (
                  <p className="mt-1.5 font-sans text-[11px] font-light text-red-600">
                    {errors.documentNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className={LABEL_CLASS}>
                  Teléfono (Opcional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="Ej: 11 2345 6789"
                  {...register("phone")}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className={LABEL_CLASS}>
                  Contraseña *
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mín. 6 caracteres"
                  {...register("password")}
                  className={INPUT_CLASS}
                />
                {errors.password && (
                  <p className="mt-1.5 font-sans text-[11px] font-light text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className={LABEL_CLASS}>
                  Confirmar Contraseña *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repetí tu clave"
                  {...register("confirmPassword")}
                  className={INPUT_CLASS}
                />
                {errors.confirmPassword && (
                  <p className="mt-1.5 font-sans text-[11px] font-light text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
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
                    CREANDO CUENTA...
                  </>
                ) : (
                  "CREAR CUENTA"
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-stone-200 pt-6 text-center font-sans text-xs font-light text-stone-500">
            <span>¿Ya tenés una cuenta registrada? </span>
            <Link
              href="/login"
              className="border-b border-stone-900 pb-0.5 text-stone-900 uppercase tracking-[0.15em] text-[11px] transition-colors hover:border-stone-500 hover:text-stone-600"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
