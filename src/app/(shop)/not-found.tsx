import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false },
};

export default function ShopNotFound() {
  return (
    <main className="mx-auto flex min-h-[70svh] max-w-xl flex-col items-center justify-center gap-5 px-4 py-24 text-center">
      <p className="eyebrow text-chocolate">Error 404</p>
      <h1 className="display text-[clamp(44px,7vw,72px)] text-ink">No encontramos esta página</h1>
      <p className="max-w-md text-base leading-relaxed text-stone-700">
        Puede que la prenda ya no esté disponible o que el link haya cambiado.
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        <Link href="/productos" className={buttonVariants({ size: "lg" })}>
          Ir a la tienda
        </Link>
        <Link href="/" className={buttonVariants({ variant: "secondary", size: "lg" })}>
          Inicio
        </Link>
      </div>
    </main>
  );
}
