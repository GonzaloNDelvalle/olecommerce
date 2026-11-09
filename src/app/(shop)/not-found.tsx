import Link from "next/link";

export default function ShopNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-[11px] tracking-[0.28em] text-[#5C4033] uppercase">
        Error 404
      </p>
      <h1 className="mt-4 font-serif text-3xl tracking-[0.08em] text-stone-900 uppercase sm:text-4xl">
        No encontramos esta página
      </h1>
      <p className="mt-3 text-sm font-light text-stone-500">
        Puede que la prenda ya no esté disponible o que el enlace haya cambiado.
      </p>
      <Link
        href="/productos"
        className="mt-8 inline-flex h-12 items-center bg-stone-900 px-8 text-xs tracking-[0.2em] text-white uppercase transition-colors hover:bg-stone-800"
      >
        Ver el catálogo
      </Link>
    </main>
  );
}
