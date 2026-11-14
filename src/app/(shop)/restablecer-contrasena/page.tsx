"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

const schema = z
  .object({
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(72, "La contraseña no puede superar los 72 caracteres"),
    confirmPassword: z.string().min(1, "Confirmá tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type Values = z.infer<typeof schema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const linkError = searchParams.get("error");
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: Values) {
    setServerError(null);
    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });
    if (error) {
      setServerError(authErrorMessage(error));
      return;
    }
    setDone(true);
  }

  if (!token || linkError) {
    return (
      <AuthAlert tone="error">
        El link venció o no es válido.{" "}
        <Link href="/recuperar-contrasena" className="underline">
          Pedí uno nuevo
        </Link>
        .
      </AuthAlert>
    );
  }

  if (done) {
    return (
      <>
        <AuthAlert tone="success">Tu contraseña quedó guardada.</AuthAlert>
        <Link href="/login" className={AUTH_BUTTON_CLASS}>
          Iniciar sesión
        </Link>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {serverError && <AuthAlert tone="error">{serverError}</AuthAlert>}
      <div>
        <label htmlFor="password" className={AUTH_LABEL_CLASS}>
          Nueva contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          {...register("password")}
          className={AUTH_INPUT_CLASS}
        />
        {errors.password && (
          <p className="mt-1.5 font-sans text-xs font-normal text-brick">
            {errors.password.message}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="confirmPassword" className={AUTH_LABEL_CLASS}>
          Repetir contraseña
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
          className={AUTH_INPUT_CLASS}
        />
        {errors.confirmPassword && (
          <p className="mt-1.5 font-sans text-xs font-normal text-brick">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className={AUTH_BUTTON_CLASS}
      >
        {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {isSubmitting ? "GUARDANDO..." : "GUARDAR CONTRASEÑA"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Nueva contraseña">
      <Suspense fallback={<div className="h-48 animate-pulse bg-stone-100" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
