import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
// La URL lleva el ID de la orden: no se indexa ni se envía como Referer a otros sitios
export const metadata: Metadata = {
  title: "Tu pedido",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};


async function TransferRedirectInner({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const { id } = await paramsPromise;
  redirect(`/checkout/confirmacion/${id}`);
  return null;
}

export default function TransferRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-16">
          <div className="h-96 animate-pulse border border-stone-200 bg-white" />
        </div>
      }
    >
      <TransferRedirectInner paramsPromise={params} />
    </Suspense>
  );
}
