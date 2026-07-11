import "server-only";
import { Resend } from "resend";

/**
 * E-postutskick via Resend. Är avsiktligt env-styrt: så länge RESEND_API_KEY
 * saknas returneras ett tydligt fel i stället för att krascha – hela flödet är
 * byggt och redo, det är bara att lägga in nyckeln (+ ev. verifierad avsändar-
 * domän) i .env så börjar utskicken fungera direkt.
 *
 *   RESEND_API_KEY=...              (krävs)
 *   RESEND_FROM="Fordania Verkstad <faktura@dindoman.se>"  (valfritt)
 */

export interface SendResult {
  ok: boolean;
  error?: string;
}

const FALLBACK_FROM = "Fordania Verkstad <onboarding@resend.dev>";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return {
      ok: false,
      error:
        "E-posttjänsten är inte konfigurerad ännu. Lägg in RESEND_API_KEY i .env så aktiveras utskicket.",
    };
  }
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM || FALLBACK_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Okänt fel vid e-postutskick.",
    };
  }
}
