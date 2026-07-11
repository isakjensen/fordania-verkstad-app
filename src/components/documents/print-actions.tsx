"use client";

import { useState, useTransition } from "react";
import { Printer, Send, Loader2, Check, ArrowLeft } from "lucide-react";
import { sendInvoice } from "@/app/(workshop)/arbetsordrar/invoice-actions";

/**
 * Verktygsrad ovanför dokumentet (döljs vid utskrift via .no-print). "Skriv ut"
 * öppnar webbläsarens utskrift där man kan spara som PDF; för fakturor finns
 * även "Skicka till kund" som mailar fakturan via Resend.
 */
export function PrintActions({
  jobId,
  kind,
  hasCustomerEmail,
}: {
  jobId: string;
  kind: "order" | "invoice";
  hasCustomerEmail: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onSend() {
    setMsg(null);
    startTransition(async () => {
      const res = await sendInvoice(jobId);
      if ("error" in res) setMsg({ ok: false, text: res.error });
      else setMsg({ ok: true, text: `Fakturan skickades till ${res.to}.` });
    });
  }

  return (
    <div className="no-print mx-auto mb-4 flex w-full max-w-[820px] flex-wrap items-center gap-2 px-4">
      <button
        type="button"
        onClick={() => history.back()}
        className="mr-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Tillbaka
      </button>

      {kind === "invoice" ? (
        <button
          type="button"
          onClick={onSend}
          disabled={pending || !hasCustomerEmail}
          title={
            hasCustomerEmail
              ? undefined
              : "Kunden saknar e-postadress (eller fordonet saknar kund)."
          }
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Skicka till kund
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted"
      >
        <Printer className="size-4" />
        Skriv ut / Spara som PDF
      </button>

      {msg ? (
        <p
          className={`w-full rounded-lg px-3 py-2 text-sm font-medium ${
            msg.ok
              ? "bg-success-soft text-success"
              : "bg-danger-soft text-danger"
          }`}
        >
          {msg.ok ? (
            <Check className="mr-1.5 inline size-4 align-text-bottom" />
          ) : null}
          {msg.text}
        </p>
      ) : null}
    </div>
  );
}
