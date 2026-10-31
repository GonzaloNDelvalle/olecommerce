"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { logoutCustomerAction } from "@/modules/auth/actions/auth.actions";

export function CustomerLogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutCustomerAction();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-none border-b border-stone-300 pb-0.5 font-sans text-xs font-light tracking-[0.15em] text-stone-600 uppercase transition-colors hover:border-stone-900 hover:text-stone-900 disabled:opacity-50"
    >
      {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
      {isPending ? "CERRANDO SESIÓN..." : "CERRAR SESIÓN"}
    </button>
  );
}
