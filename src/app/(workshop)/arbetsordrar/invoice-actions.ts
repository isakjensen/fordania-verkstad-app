"use server";

import { getActiveOrganizationId } from "@/lib/session";
import { getWorkOrderDocument } from "@/lib/data/work-orders";
import { docModel, invoiceEmailHtml } from "@/lib/documents";
import { sendEmail } from "@/lib/email";

/**
 * Skickar en faktura för arbetsordern till den kopplade kundens e-post via
 * Resend. Ger tydliga fel om kund/e-post saknas eller om e-posttjänsten inte
 * är konfigurerad ännu (RESEND_API_KEY).
 */
export async function sendInvoice(
  jobId: string,
): Promise<{ ok: true; to: string } | { error: string }> {
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: "Ingen aktiv verkstad." };

  const job = await getWorkOrderDocument(jobId, organizationId);
  if (!job) return { error: "Arbetsordern hittades inte." };

  const { customer, ref } = docModel(job);
  if (!customer) {
    return {
      error:
        "Fordonet saknar kopplad kund att fakturera. Koppla en kund till fordonet först.",
    };
  }
  if (!customer.email) {
    return { error: `Kunden ${customer.name} saknar e-postadress.` };
  }

  const res = await sendEmail({
    to: customer.email,
    subject: `Faktura ${ref} – ${job.organization?.name ?? "Verkstaden"}`,
    html: invoiceEmailHtml(job, new Date()),
  });
  if (!res.ok) return { error: res.error ?? "Kunde inte skicka fakturan." };
  return { ok: true, to: customer.email };
}
