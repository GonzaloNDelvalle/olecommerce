"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import {
  FolderPlus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Tags,
} from "lucide-react";
import {
  getAdminCategories,
  createAdminCategory,
  deleteAdminCategory,
  type AdminCategoryDTO,
} from "@/modules/admin/actions/admin-categories.actions";

function AdminCategoriesManager() {
  const [categories, setCategories] = useState<AdminCategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadCategories() {
    const data = await getAdminCategories();
    setCategories(data);
  }

  useEffect(() => {
    let active = true;
    getAdminCategories()
      .then((data) => {
        if (active) setCategories(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function handleCreateCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const result = await createAdminCategory({
        name,
        description,
      });

      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      setName("");
      setDescription("");
      setSuccessMessage(result.message);
      await loadCategories();
    });
  }

  function handleDeleteCategory(category: AdminCategoryDTO) {
    const confirmed = window.confirm(
      `¿Confirmás eliminar la categoría "${category.name}" (/${category.slug})?`
    );
    if (!confirmed) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setDeletingId(category.id);

    startTransition(async () => {
      const result = await deleteAdminCategory(category.id);
      setDeletingId(null);

      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      setSuccessMessage(result.message);
      await loadCategories();
    });
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* COLUMNA IZQUIERDA: Formulario de Alta de Categoría (4 columnas) */}
      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-2xs lg:col-span-4 lg:self-start">
        <div className="flex items-center gap-2 border-b border-stone-200 pb-4">
          <FolderPlus className="h-4 w-4 text-stone-900" />
          <h2 className="text-sm font-semibold tracking-wider text-stone-900 uppercase">
            Nueva Categoría
          </h2>
        </div>

        <form onSubmit={handleCreateCategory} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="category-name"
              className="block text-xs font-medium text-stone-700"
            >
              Nombre de la Categoría *
            </label>
            <input
              id="category-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Vestidos de Fiesta"
              className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="category-description"
              className="block text-xs font-medium text-stone-700"
            >
              Descripción (Opcional)
            </label>
            <textarea
              id="category-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción breve para organización del catálogo..."
              className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-5 py-3 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {isPending && !deletingId ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creando Categoría...
              </>
            ) : (
              <>
                <FolderPlus className="h-4 w-4" />
                Crear Categoría
              </>
            )}
          </button>
        </form>
      </section>

      {/* COLUMNA DERECHA: Listado y Baja de Categorías Activas (8 columnas) */}
      <section className="space-y-4 lg:col-span-8">
        {errorMessage && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <p>{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <p>{successMessage}</p>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-6 py-4">
            <div className="flex items-center gap-2">
              <Tags className="h-4 w-4 text-stone-600" />
              <h2 className="text-xs font-semibold tracking-wider text-stone-800 uppercase">
                Categorías Registradas ({categories.length})
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="p-8">
              <div className="h-40 animate-pulse rounded-lg bg-stone-100" />
            </div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center text-sm text-stone-500">
              No hay categorías registradas todavía. Creá la primera desde el
              formulario lateral.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-stone-200 text-xs font-semibold tracking-wider text-stone-500 uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Nombre</th>
                    <th className="px-6 py-3.5">Slug (URL)</th>
                    <th className="px-6 py-3.5 text-center">Prendas</th>
                    <th className="px-6 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-stone-50/70">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-stone-900">
                          {cat.name}
                        </p>
                        {cat.description && (
                          <p className="mt-0.5 text-xs text-stone-500">
                            {cat.description}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-stone-500">
                        ?categoria={cat.slug}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-800">
                          {cat.productsCount}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          disabled={isPending && deletingId === cat.id}
                          title={
                            cat.productsCount > 0
                              ? "Tiene productos asociados"
                              : "Eliminar categoría"
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {isPending && deletingId === cat.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          Gestión de Categorías
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Administrá las categorías del catálogo que alimentan los filtros de la
          tienda y el formulario de alta de prendas.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-xl bg-stone-200/70" />
        }
      >
        <AdminCategoriesManager />
      </Suspense>
    </div>
  );
}
