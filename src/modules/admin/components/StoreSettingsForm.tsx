"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import {
  updateAdminStoreSettings,
  type StoreSettingsInput,
} from "@/modules/admin/actions/admin-settings.actions";
import type { StoreSettingsDTO } from "@/modules/settings/store-settings";
import {
  AdminCard,
  AdminNotice,
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
} from "@/modules/admin/components/AdminUi";

type FormValues = Omit<StoreSettingsDTO, "bankTransferDiscountPercentage"> & {
  bankTransferDiscountPercentage: number | string;
};

const TEXT_FIELDS: {
  section: "contact" | "bank";
  name: keyof FormValues;
  label: string;
  placeholder?: string;
}[] = [
  { section: "contact", name: "storeName", label: "Nombre de la tienda" },
  { section: "contact", name: "supportEmail", label: "Email de atención", placeholder: "hola@tutienda.com" },
  { section: "contact", name: "whatsappNumber", label: "WhatsApp", placeholder: "+54 9 11 1234-5678" },
  { section: "contact", name: "instagramUrl", label: "Instagram", placeholder: "https://instagram.com/..." },
  { section: "contact", name: "showroomAddress", label: "Dirección del showroom (retiros)", placeholder: "Calle 123, Palermo, CABA" },
  { section: "bank", name: "bankName", label: "Banco", placeholder: "Banco Galicia — Cuenta Corriente en Pesos" },
  { section: "bank", name: "bankAccountHolder", label: "Titular" },
  { section: "bank", name: "bankCuit", label: "CUIT", placeholder: "30-12345678-9" },
  { section: "bank", name: "bankCbu", label: "CBU / CVU", placeholder: "22 números" },
  { section: "bank", name: "bankAlias", label: "Alias" },
];

export function StoreSettingsForm({ initial }: { initial: StoreSettingsDTO }) {
  const [result, setResult] = useState<
    { tone: "success" | "error"; text: string } | null
  >(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({ defaultValues: initial });

  async function onSubmit(values: FormValues) {
    setResult(null);
    const payload: StoreSettingsInput = {
      ...values,
      bankTransferDiscountPercentage: Number(values.bankTransferDiscountPercentage) || 0,
    };
    const response = await updateAdminStoreSettings(payload);
    setResult(
      response.success
        ? { tone: "success", text: response.message }
        : { tone: "error", text: response.error }
    );
  }

  const renderFields = (section: "contact" | "bank") => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {TEXT_FIELDS.filter((field) => field.section === section).map((field) => (
        <div key={field.name}>
          <label htmlFor={field.name} className={adminLabelClass}>
            {field.label}
          </label>
          <input
            id={field.name}
            type="text"
            placeholder={field.placeholder}
            {...register(field.name, {
              setValueAs: (value: string | null) => value ?? "",
            })}
            className={`mt-1.5 ${adminInputClass}`}
          />
        </div>
      ))}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {result && <AdminNotice tone={result.tone}>{result.text}</AdminNotice>}

      <AdminCard
        title="Datos de contacto"
        description="Se muestran en los emails, la confirmación de compra y el retiro en showroom."
      >
        {renderFields("contact")}
      </AdminCard>

      <AdminCard
        title="Transferencia bancaria"
        description="Datos que ve la clienta al elegir transferencia. Verificalos antes de lanzar."
      >
        <div className="mb-5 flex flex-wrap items-center gap-6">
          <label className="inline-flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              {...register("bankTransferEnabled")}
              className="h-4 w-4 rounded border-stone-300"
            />
            Ofrecer pago por transferencia
          </label>
          <div className="flex items-center gap-2">
            <label htmlFor="bankTransferDiscountPercentage" className={adminLabelClass}>
              Descuento %
            </label>
            <input
              id="bankTransferDiscountPercentage"
              type="number"
              min={0}
              max={50}
              {...register("bankTransferDiscountPercentage")}
              className={`w-20 ${adminInputClass}`}
            />
          </div>
        </div>
        {renderFields("bank")}
      </AdminCard>

      <button type="submit" disabled={isSubmitting} className={adminPrimaryButtonClass}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Guardar configuración
      </button>
    </form>
  );
}
