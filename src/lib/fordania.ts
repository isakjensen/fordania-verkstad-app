import "server-only";

/**
 * Klient mot Fordanias publika Vehicles-API (huvudappen). Read-only – hämtar de
 * fordon som hör till vår domän så att de kan synkas in i verkstadsregistret.
 *
 * Konfigureras via miljövariabler (håll nyckel/token hemliga):
 *   FORDANIA_API_URL      – t.ex. https://app.fordania.se
 *   FORDANIA_API_KEY      – delad serverhemlighet från Fordania
 *   FORDANIA_DOMAIN_TOKEN – identifierar vilken domäns fordon vi får
 */

export interface FordaniaVehicle {
  plate: string;
  model: string | null;
  year: string | null;
  color: string | null;
}

interface FordaniaResponse {
  success: boolean;
  domain?: { id: number; name: string };
  count?: number;
  vehicles?: FordaniaVehicle[];
  error?: string;
}

/** Kastas när synken inte kan genomföras – meddelandet visas för användaren. */
export class FordaniaSyncError extends Error {}

const CONFIG_MISSING =
  "Fordania-integrationen är inte konfigurerad. Kontakta administratören (FORDANIA_API_KEY / FORDANIA_DOMAIN_TOKEN saknas).";

/** Mänskligt felmeddelande per HTTP-status från API:et. */
function messageForStatus(status: number, apiError?: string): string {
  switch (status) {
    case 400:
      return "Domän-token saknas i anropet.";
    case 401:
      return "Ogiltig API-nyckel mot Fordania.";
    case 403:
      return "Domän-token matchar ingen domän i Fordania.";
    case 503:
      return "Fordania saknar sin API-nyckelkonfiguration just nu. Försök igen senare.";
    default:
      return apiError || `Fordania svarade med fel (${status}).`;
  }
}

/**
 * Hämtar alla synliga/bokningsbara fordon för vår domän från Fordania.
 * Kastar {@link FordaniaSyncError} med ett svenskt meddelande vid fel.
 */
export async function fetchFordaniaVehicles(): Promise<FordaniaVehicle[]> {
  const baseUrl = process.env.FORDANIA_API_URL?.replace(/\/+$/, "");
  const apiKey = process.env.FORDANIA_API_KEY;
  const domainToken = process.env.FORDANIA_DOMAIN_TOKEN;

  if (!baseUrl || !apiKey || !domainToken) {
    throw new FordaniaSyncError(CONFIG_MISSING);
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/public/vehicles`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Domain-Token": domainToken,
        Accept: "application/json",
      },
      // Alltid färsk data – vi synkar på begäran.
      cache: "no-store",
      // Låt aldrig fordonssidan hänga sig om Fordania är segt/nere.
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new FordaniaSyncError(
      "Kunde inte nå Fordania. Kontrollera internetanslutningen och försök igen.",
    );
  }

  let data: FordaniaResponse | null = null;
  try {
    data = (await res.json()) as FordaniaResponse;
  } catch {
    data = null;
  }

  if (!res.ok || !data?.success) {
    throw new FordaniaSyncError(messageForStatus(res.status, data?.error));
  }

  return data.vehicles ?? [];
}
