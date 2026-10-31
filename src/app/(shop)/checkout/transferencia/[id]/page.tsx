import { Suspense } from "react";
import { redirect } from "next/navigation";

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
          <div className="h-96 animate-pulse rounded-none border border-stone-200 bg-white" />
        </div>
      }
    >
      <TransferRedirectInner paramsPromise={params} />
    </Suspense>
  );
}
