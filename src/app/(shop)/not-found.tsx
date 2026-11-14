import Link from "next/link";

export default function ShopNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-xs tracking-[0.16em] text-chocolate uppercase">
        Error 404
      </p>
      <h1 className="mt-4 font-serif text-3xl tracking-[0.08em] text-ink uppercase sm:text-4xl">
        No encontramos esta página
      </h1>
      <p className="mt-3 text-sm font-normal text-stone-500">
        Puede que la prenda ya no esté disponible o que el enlace haya cambiado.
      </p>
      <Link
        href="/productos"
        className="mt-8 inline-flex h-12 items-center bg-ink px-8 text-xs tracking-[0.2em] text-white uppercase transition-colors hover:bg-espresso"
      >
        Ver el catálogo
      </Link>
    </main>
  );
}
