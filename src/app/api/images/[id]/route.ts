// Serverar en uppladdad arbetsorderbild. Kräver inloggning och att bilden
// tillhör den aktiva tenanten – nyckeln exponeras aldrig utåt, allt går via
// bildens id. Catch-all/dynamiska route-handlers måste vara force-dynamic i
// Next 16, annars prerenderas de och ger 404 i drift.
export const dynamic = "force-dynamic";

import { getSession, getActiveOrganizationId } from "@/lib/session";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const image = await db.workOrderImage.findFirst({
    where: { id, organizationId },
  });
  if (!image) return new Response("Not found", { status: 404 });

  const bytes = await storage.read(image.storageKey);
  if (!bytes) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": image.mimeType,
      "Content-Length": String(bytes.length),
      // Privat cache – bilden är tenant-scopad, inte publik.
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(
        image.fileName,
      )}`,
    },
  });
}
