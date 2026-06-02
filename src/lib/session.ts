import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/** Hämtar aktuell session (eller null) i en server-komponent/action. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Kräver inloggad användare, annars redirect till /login. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Kräver global superadmin (User.role = "admin"), annars redirect. */
export async function requireSuperadmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/");
  return session;
}

/** True om användaren är global superadmin. */
export function isSuperadmin(session: Awaited<ReturnType<typeof getSession>>) {
  return session?.user.role === "admin";
}
