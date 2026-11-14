"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, MailCheck } from "lucide-react";
import {
  registerFormSchema,
  type RegisterFormValues,
} from "@/modules/auth/schemas/auth.schema";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";


import { INPUT_CLASS, LABEL_CLASS, SUBMIT_CLASS } from "@/components/ui/form";

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

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

    const email = values.email.trim().toLowerCase();
    const { error } = await authClient.signUp.email({
      email,
      password: values.password,
      name: `${values.firstName} ${values.lastName}`.trim(),
      firstName: values.firstName,
      lastName: values.lastName,
      documentNumber: values.documentNumber || undefined,
      phone: values.phone || undefined,
      callbackURL: "/mi-cuenta",
    });

    if (error) {
      setServerError(authErrorMessage(error));
      return;
    }

    // La respuesta es la misma aunque el email ya exista (no se revela qué
    // emails están registrados); en ese caso la dueña recibe otro aviso.
    setPendingEmail(email);
  }

  if (pendingEmail) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-paper">
        <div className="mx-auto max-w-md px-4 py-20">
          <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(44,33,25,0.06)] text-center sm:p-9">
            <MailCheck className="mx-auto h-8 w-8 text-ink" strokeWidth={1.25} />
            <h1 className="display mt-6 text-[clamp(40px,6vw,56px)] text-ink">
              Revisá tu email
            </h1>
            <p className="mt-4 font-sans text-sm leading-relaxed font-normal text-stone-600">
              Te enviamos un link a <strong className="font-medium text-ink">{pendingEmail}</strong> para
              confirmar tu cuenta. El link vence en 24 horas.
            </p>
            <p className="mt-3 font-sans text-xs leading-relaxed font-normal text-stone-500">
              Si ya habías comprado con este email, vas a recibir un link para crear tu contraseña.
              Si no lo ves, revisá la carpeta de spam.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-block border-b border-ink pb-0.5 text-xs tracking-[0.15em] text-ink uppercase transition-colors hover:border-stone-500 hover:text-stone-600"
            >
              Ir a iniciar sesión
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-paper">
      <div className="mx-auto max-w-md px-4 py-20">
        <header className="mb-10 text-center">
          <h1 className="display mt-4 text-[clamp(40px,6vw,56px)] text-ink">
            Crear cuenta
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[15px] text-stone-700">
            ESPACIO PERSONAL &amp; SEGUIMIENTO DE ENVÍOS
          </p>
        </header>

        <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(44,33,25,0.06)] sm:p-9">
          {serverError && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-brick/30 bg-brick/5 p-4 text-sm text-brick">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brick" />
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
                  <p className="mt-1.5 text-[13px] font-medium text-brick">
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
                  <p className="mt-1.5 text-[13px] font-medium text-brick">
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
                <p className="mt-1.5 text-[13px] font-medium text-brick">
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
                  <p className="mt-1.5 text-[13px] font-medium text-brick">
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
                  <p className="mt-1.5 text-[13px] font-medium text-brick">
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
                  <p className="mt-1.5 text-[13px] font-medium text-brick">
                    {errors.confirmPassword.message}
                  </p>
                )}
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
                    Creando cuenta…
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-stone-200 pt-6 text-center font-sans text-xs font-normal text-stone-500">
            <span>¿Ya tenés una cuenta registrada? </span>
            <Link
              href="/login"
              className="border-b border-ink pb-0.5 text-ink uppercase tracking-[0.15em] text-xs transition-colors hover:border-stone-500 hover:text-stone-600"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
