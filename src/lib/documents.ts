import {
  orderTotals,
  partTotals,
  laborLines,
  formatOre,
} from "@/lib/pricing";
import type { WorkOrderDocument } from "@/lib/data/work-orders";

/** En arbetsrad (mekanikers timlön) för faktura/utskrift. */
export interface LaborRow {
  name: string;
  hours: number;
  rateOre: number;
  vatRate: number;
  exclOre: number;
  vatOre: number;
  inclOre: number;
}

/** Bygger arbetsrader ur orderns mekaniker (bara de med timpris + timmar). */
export function laborRowsOf(job: WorkOrderDocument): LaborRow[] {
  return job.mechanics
    .filter(
      (m) =>
        m.hourlyRateOreExcl != null &&
        m.hourlyRateOreExcl > 0 &&
        m.hours != null &&
        m.hours > 0,
    )
    .map((m) => {
      const hours = m.hours as number;
      const rateOre = m.hourlyRateOreExcl as number;
      const t = partTotals({
        quantity: hours,
        unitPriceExclOre: rateOre,
        vatRate: m.vatRate,
      });
      return {
        name: m.user.name ?? "Mekaniker",
        hours,
        rateOre,
        vatRate: m.vatRate,
        ...t,
      };
    });
}

/** Härledda uppgifter som både utskrifts-vyn och e-postfakturan behöver. */
export function docModel(job: WorkOrderDocument) {
  const ref = job.id.slice(-6).toUpperCase();
  const primaryVehicle = job.vehicles[0]?.vehicle ?? null;
  const customer = primaryVehicle?.customers?.[0]?.customer ?? null;
  const labor = laborRowsOf(job);
  // Totalen räknar in både delar och arbetskostnad.
  const totals = orderTotals([
    ...job.parts,
    ...laborLines(
      job.mechanics.map((m) => ({
        hours: m.hours,
        hourlyRateOreExcl: m.hourlyRateOreExcl,
        vatRate: m.vatRate,
      })),
    ),
  ]);
  const mechanics = job.mechanics
    .map((m) => m.user.name)
    .filter((n): n is string => Boolean(n));
  return { ref, primaryVehicle, customer, totals, mechanics, labor };
}

const dateFmt = new Intl.DateTimeFormat("sv-SE", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Bygger en HTML-faktura för e-post. Rena inline-stilar så den renderas rätt i
 * de flesta e-postklienter. `todayISO` skickas in (Date är inte tillåtet i vissa
 * kontexter) – eller så sätts dagens datum av anroparen.
 */
export function invoiceEmailHtml(
  job: WorkOrderDocument,
  today: Date,
): string {
  const { ref, primaryVehicle, customer, totals, labor } = docModel(job);
  const org = job.organization;
  const workshop = org?.name ?? "Verkstaden";
  const termsDays = org?.paymentTermsDays ?? 30;
  const dueDate = new Date(today.getTime() + termsDays * 24 * 60 * 60 * 1000);
  const senderLines = [
    org?.address,
    [org?.postalCode, org?.city].filter(Boolean).join(" ") || null,
    org?.orgNumber ? `Org.nr ${org.orgNumber}` : null,
    org?.vatNumber ? `Moms ${org.vatNumber}` : null,
    [org?.phone, org?.email].filter(Boolean).join(" · ") || null,
  ].filter((l): l is string => Boolean(l));
  const veh = primaryVehicle
    ? `${primaryVehicle.regNo}${
        primaryVehicle.brand || primaryVehicle.model
          ? ` · ${[primaryVehicle.brand, primaryVehicle.model]
              .filter(Boolean)
              .join(" ")}`
          : ""
      }`
    : "—";

  const partRows = job.parts.map((p) => {
    const t = partTotals(p);
    return `<tr>
              <td style="padding:8px 6px;border-bottom:1px solid #e9ecf1">${escapeHtml(p.title)}</td>
              <td style="padding:8px 6px;border-bottom:1px solid #e9ecf1;text-align:right">${p.quantity}</td>
              <td style="padding:8px 6px;border-bottom:1px solid #e9ecf1;text-align:right">${formatOre(p.unitPriceExclOre)}</td>
              <td style="padding:8px 6px;border-bottom:1px solid #e9ecf1;text-align:right">${p.vatRate}%</td>
              <td style="padding:8px 6px;border-bottom:1px solid #e9ecf1;text-align:right">${formatOre(t.inclOre)}</td>
            </tr>`;
  });
  // Arbetsrader (mekanikers timlön) – en rad per mekaniker med timpris + timmar.
  const laborHtml = labor.map((l) => {
    return `<tr>
              <td style="padding:8px 6px;border-bottom:1px solid #e9ecf1">Arbete – ${escapeHtml(l.name)}</td>
              <td style="padding:8px 6px;border-bottom:1px solid #e9ecf1;text-align:right">${formatHours(l.hours)} tim</td>
              <td style="padding:8px 6px;border-bottom:1px solid #e9ecf1;text-align:right">${formatOre(l.rateOre)}</td>
              <td style="padding:8px 6px;border-bottom:1px solid #e9ecf1;text-align:right">${l.vatRate}%</td>
              <td style="padding:8px 6px;border-bottom:1px solid #e9ecf1;text-align:right">${formatOre(l.inclOre)}</td>
            </tr>`;
  });
  const allRows = [...partRows, ...laborHtml];
  const rows =
    allRows.length > 0
      ? allRows.join("")
      : `<tr><td colspan="5" style="padding:14px 6px;color:#697384;text-align:center">Inga fakturarader angivna.</td></tr>`;

  return `<!doctype html><html><body style="margin:0;background:#f5f7fa;font-family:Segoe UI,Roboto,Arial,sans-serif;color:#172230">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:#fff;border:1px solid #e9ecf1;border-radius:14px;padding:28px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:20px;font-weight:800;letter-spacing:-.02em;color:#3a86dd">${escapeHtml(workshop)}</div>
          <div style="font-size:12px;color:#697384;margin-top:4px;line-height:1.5">${senderLines
            .map((l) => escapeHtml(l))
            .join("<br>")}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:12px;color:#697384">Fakturanr</div>
          <div style="font-weight:700;font-family:monospace">${ref}</div>
          <div style="font-size:12px;color:#697384;margin-top:6px">${dateFmt.format(today)}</div>
        </div>
      </div>

      <div style="margin-top:22px;font-size:14px">
        <div style="color:#697384;font-size:11px;text-transform:uppercase;letter-spacing:.08em">Faktureras</div>
        <div style="font-weight:700;margin-top:3px">${escapeHtml(customer?.name ?? "Kund")}</div>
        ${customer?.address ? `<div style="color:#3c4655">${escapeHtml(customer.address)}</div>` : ""}
        ${customer?.orgNumber ? `<div style="color:#697384;font-size:12px">Org.nr ${escapeHtml(customer.orgNumber)}</div>` : ""}
      </div>

      <div style="margin-top:18px;font-size:13px;color:#3c4655">
        <strong>${escapeHtml(job.type)}</strong> · ${escapeHtml(veh)}
        ${job.description ? `<div style="margin-top:6px;color:#697384">${escapeHtml(job.description)}</div>` : ""}
      </div>

      <table style="width:100%;border-collapse:collapse;margin-top:20px;font-size:13px">
        <thead>
          <tr style="color:#697384;font-size:11px;text-transform:uppercase;letter-spacing:.06em">
            <th style="padding:6px;text-align:left">Rad</th>
            <th style="padding:6px;text-align:right">Antal</th>
            <th style="padding:6px;text-align:right">À-pris</th>
            <th style="padding:6px;text-align:right">Moms</th>
            <th style="padding:6px;text-align:right">Summa</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="margin-top:16px;margin-left:auto;width:240px;font-size:13px">
        <div style="display:flex;justify-content:space-between;padding:4px 0"><span style="color:#697384">Netto</span><span>${formatOre(totals.exclOre)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0"><span style="color:#697384">Moms</span><span>${formatOre(totals.vatOre)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-top:1px solid #e9ecf1;font-weight:800;font-size:15px"><span>Att betala</span><span>${formatOre(totals.inclOre)}</span></div>
      </div>

      <div style="margin-top:20px;padding-top:14px;border-top:1px solid #e9ecf1;font-size:12px;color:#3c4655">
        Betalningsvillkor ${termsDays} dagar · Förfaller ${dateFmt.format(dueDate)}${org?.bankgiro ? ` · Bankgiro ${escapeHtml(org.bankgiro)}` : ""}
      </div>
    </div>
    <div style="text-align:center;color:#98a2b3;font-size:11px;margin-top:14px">
      ${escapeHtml(workshop)} · Faktura genererad via Fordania Verkstad
    </div>
  </div>
</body></html>`;
}

/** Timmar utan onödiga decimaler: 2 → "2", 2.5 → "2,5". */
export function formatHours(hours: number): string {
  return (Number.isInteger(hours) ? String(hours) : hours.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")).replace(".", ",");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
