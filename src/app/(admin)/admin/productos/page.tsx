import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, ExternalLink, Shirt, Layers } from "lucide-react";
import { getAdminCatalogProducts } from "@/modules/admin/actions/admin-products.actions";
import { ProductRowActions } from "@/modules/admin/components/ProductRowActions";

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

async function CatalogTableContent() {
  const products = await getAdminCatalogProducts();

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white p-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500">
          <Shirt className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-stone-900">
          No hay prendas cargadas en el catálogo
        </h2>
        <p className="mt-1 max-w-sm text-xs text-stone-500">
          Comenzá dando de alta tu primer producto asignándole su categoría,
          talles, colores y stock físico.
        </p>
        <Link
          href="/admin/productos/nuevo"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-2.5 text-xs font-semibold tracking-wider text-white uppercase hover:bg-stone-800"
        >
          <Plus className="h-4 w-4" />
          Crear Primer Producto
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xs">
      <div className="w-full overflow-x-auto">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
            <tr>
              <th className="w-56 px-4 py-3.5">Prenda</th>
              <th className="w-40 px-4 py-3.5">Categoría</th>
              <th className="w-28 px-4 py-3.5">Estado</th>
              <th className="w-36 px-4 py-3.5">Precio Actual</th>
              <th className="w-72 px-4 py-3.5">Matriz de Variantes</th>
              <th className="w-36 px-4 py-3.5 text-right">Stock</th>
              <th className="w-48 px-4 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {products.map((product) => (
              <tr
                key={product.id}
                className="align-top transition-colors hover:bg-stone-50/70"
              >
                {/* 1. Foto y Nombre (con truncado de texto largo) */}
                <td className="px-4 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md border border-stone-200 bg-stone-100">
                      {product.primaryImageUrl ? (
                        <Image
                          src={product.primaryImageUrl}
                          alt={product.name}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[9px] text-stone-400 uppercase">
                          N/A
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p
                          title={product.name}
                          className="truncate font-semibold text-stone-900"
                        >
                          {product.name}
                        </p>
                        <Link
                          href={`/productos/${product.slug}`}
                          target="_blank"
                          title="Ver en tienda pública"
                          className="shrink-0 text-stone-400 transition-colors hover:text-stone-900"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                      <p
                        title={`/${product.slug}`}
                        className="truncate font-mono text-xs text-stone-400"
                      >
                        /{product.slug}
                      </p>
                    </div>
                  </div>
                </td>

                {/* 2. Categoría y Colección */}
                <td className="px-4 py-4">
                  <p
                    title={product.categoryName}
                    className="truncate font-medium text-stone-800"
                  >
                    {product.categoryName}
                  </p>
                  {product.collectionName && (
                    <p
                      title={product.collectionName}
                      className="truncate text-xs text-stone-500"
                    >
                      {product.collectionName}
                    </p>
                  )}
                </td>

                {/* 3. Estado */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      product.status === "ACTIVE"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : product.status === "DRAFT"
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-stone-300 bg-stone-100 text-stone-600"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        product.status === "ACTIVE"
                          ? "bg-emerald-600"
                          : product.status === "DRAFT"
                            ? "bg-amber-500"
                            : "bg-stone-500"
                      }`}
                    />
                    {product.status}
                  </span>
                </td>

                {/* 4. Precio Actual */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-stone-900">
                      {arsFormatter.format(product.basePrice)}
                    </p>
                    {product.discountPercentage > 0 && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        -{product.discountPercentage}%
                      </span>
                    )}
                  </div>
                  {product.compareAtPrice && (
                    <p className="text-xs text-stone-400 line-through">
                      {arsFormatter.format(product.compareAtPrice)}
                    </p>
                  )}
                  <p className="mt-0.5 text-[11px] text-stone-400">
                    {product.weightInGrams} g • {product.galleryImagesCount}{" "}
                    foto/s
                  </p>
                </td>

                {/* 5. Matriz de Variantes (Chips horizontales con flex-wrap gap-2 y alto acotado con overflow-y-auto) */}
                <td className="px-4 py-4">
                  <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1">
                    {product.variants.map((v) => (
                      <span
                        key={v.id}
                        title={`${v.colorName} • Talle ${v.sizeName} (${v.availableStock} disp.) — SKU: ${v.sku}`}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] text-stone-700"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full border border-stone-300"
                          style={{ backgroundColor: v.colorHex }}
                        />
                        <strong className="font-semibold text-stone-900">
                          {v.sizeName}
                        </strong>
                        <span className="text-stone-400">•</span>
                        <span>{v.availableStock} u.</span>
                      </span>
                    ))}
                  </div>
                </td>

                {/* 6. Stock Consolidado */}
                <td className="px-4 py-4 text-right whitespace-nowrap">
                  <div className="inline-flex flex-col items-end">
                    <span
                      className={`text-sm font-bold ${
                        product.totalAvailableStock > 0
                          ? "text-stone-900"
                          : "text-red-600"
                      }`}
                    >
                      {product.totalAvailableStock} disp.
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-stone-500">
                      <Layers className="h-3 w-3 shrink-0" />
                      Fís: {product.totalPhysicalStock} | Res:{" "}
                      {product.totalReservedStock}
                    </span>
                  </div>
                </td>

                {/* 7. Acciones Rápidas (Editar / Pausar / Eliminar) */}
                <td className="px-4 py-4 text-right whitespace-nowrap">
                  <ProductRowActions
                    productId={product.id}
                    productName={product.name}
                    currentStatus={product.status}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <div className="min-w-0 space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            Catálogo de Productos
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Controlá tus prendas activas, precios y el stock consolidado de
            todas sus variantes.
          </p>
        </div>

        <Link
          href="/admin/productos/nuevo"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-stone-900 px-5 py-3 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-stone-800"
        >
          <Plus className="h-4 w-4" />
          Nuevo Producto
        </Link>
      </header>

      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-xl bg-stone-200/70" />
        }
      >
        <CatalogTableContent />
      </Suspense>
    </div>
  );
}
