-- Förenkla rollerna: "Ägare" (owner) slås ihop med "Admin".
-- Befintliga ägare blir administratörer med samma rättigheter.
UPDATE "members" SET "role" = 'admin' WHERE "role" = 'owner';
