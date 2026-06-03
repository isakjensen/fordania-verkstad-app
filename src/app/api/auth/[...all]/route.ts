import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Auth-endpointen måste alltid köras dynamiskt vid request. Utan detta försöker
// Turbopack statiskt analysera catch-all-routen vid bygget och kraschar i en
// worker ("Failed to generate static paths"), vilket gör att hela /api/auth
// faller igenom till 404 och inloggning slutar fungera.
export const dynamic = "force-dynamic";

export const { GET, POST } = toNextJsHandler(auth);
