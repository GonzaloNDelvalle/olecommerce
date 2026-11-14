"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function CustomerLogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="pressable inline-flex h-11 items-center gap-2 rounded-full border border-stone-300 px-5 text-sm font-semibold text-ink hover:border-ink disabled:opacity-50"
    >
      {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
      {isPending ? "CERRANDO SESIÓN..." : "CERRAR SESIÓN"}
    </button>
  );
}
