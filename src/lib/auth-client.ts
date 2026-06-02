import { createAuthClient } from "better-auth/react";
import { organizationClient, adminClient } from "better-auth/client/plugins";

/**
 * Better Auth – klient för React. Exponerar inloggning, session och
 * organization-/admin-funktioner till komponenterna.
 */
export const authClient = createAuthClient({
  plugins: [organizationClient(), adminClient()],
});

export const { signIn, signOut, useSession } = authClient;
