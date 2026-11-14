"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
  className?: string;
}

export function CopyButton({
  textToCopy,
  label = "Copiar",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold transition-colors ${
        copied
          ? "text-olive-deep font-semibold"
          : "text-stone-500 hover:text-ink"
      } ${className}`}
      title="Copiar al portapapeles"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 stroke-[2]" />
          <span>¡Copiado!</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3 stroke-[1.5]" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
