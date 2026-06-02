-- Byter tabellnamn till plural. RENAME bevarar all data, index och
-- främmande nycklar (till skillnad från drop/create som Prisma annars
-- föreslår). Endast de fysiska tabellnamnen ändras – Prisma-modellerna
-- (User, Session, ...) och all kod är oförändrade tack vare @@map.

ALTER TABLE "user" RENAME TO "users";
ALTER TABLE "session" RENAME TO "sessions";
ALTER TABLE "account" RENAME TO "accounts";
ALTER TABLE "verification" RENAME TO "verifications";
ALTER TABLE "organization" RENAME TO "organizations";
ALTER TABLE "member" RENAME TO "members";
ALTER TABLE "invitation" RENAME TO "invitations";
ALTER TABLE "vehicle" RENAME TO "vehicles";
ALTER TABLE "mechanic" RENAME TO "mechanics";
ALTER TABLE "job" RENAME TO "jobs";
