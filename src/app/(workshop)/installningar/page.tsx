import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Palette,
  UserRound,
  Building2,
  ListChecks,
  Info,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { TenantLogo } from "@/components/ui/tenant-logo";
import {
  getSession,
  getActiveOrganizationId,
  getTenantRole,
  canManageUsers,
} from "@/lib/session";
import { getSwitcherData } from "@/lib/data/tenant-context";
import { getFieldDefinitions } from "@/lib/data/vehicles";
import { AppearanceSettings } from "./appearance";
import { PasswordForm } from "./password-form";
import { VehicleFieldsManager } from "./vehicle-fields-manager";

export const metadata: Metadata = { title: "Inställningar" };

const roleLabels: Record<string, string> = {
  admin: "Administratör",
  owner: "Ägare",
  member: "Medarbetare",
};

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex items-start gap-3 border-b border-line px-5 py-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="size-[1.1rem]" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-ink">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-ink">{children}</span>
    </div>
  );
}

export default async function SettingsPage() {
  const session = await getSession();
  const organizationId = await getActiveOrganizationId();
  const role = organizationId ? await getTenantRole(organizationId) : null;
  const isAdmin = canManageUsers(role);
  const [switcher, fields] = await Promise.all([
    getSwitcherData(),
    organizationId ? getFieldDefinitions(organizationId) : Promise.resolve([]),
  ]);

  const user = session?.user;
  const active =
    switcher.tenants.find((t) => t.id === switcher.activeId) ??
    switcher.tenants[0] ??
    null;

  return (
    <div className="mx-auto w-full max-w-[760px] px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5">
        {/* Utseende */}
        <Section
          icon={Palette}
          title="Utseende"
          description="Välj ljust, mörkt eller följ systemets läge. Gäller hela appen."
        >
          <AppearanceSettings />
        </Section>

        {/* Konto */}
        <Section
          icon={UserRound}
          title="Konto"
          description="Dina inloggningsuppgifter och lösenord."
        >
          {user ? (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-line bg-surface-muted/40 p-3.5">
              <Avatar initials={initialsOf(user.name)} size="size-11 text-sm" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{user.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
          ) : null}
          <PasswordForm />
        </Section>

        {/* Verkstad */}
        {active ? (
          <Section
            icon={Building2}
            title="Verkstad"
            description="Den verkstad du är inloggad i."
          >
            <div className="flex items-center gap-3 pb-2">
              <TenantLogo tenant={active} size="md" />
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-ink">
                  {active.name}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {active.city ?? "Verkstad"}
                </p>
              </div>
            </div>
            <div className="divide-y divide-line border-t border-line">
              <InfoRow label="Din roll">
                <span className="inline-flex items-center gap-1.5">
                  {isAdmin ? (
                    <ShieldCheck className="size-3.5 text-brand-600" />
                  ) : null}
                  {roleLabels[role ?? ""] ?? "Medarbetare"}
                </span>
              </InfoRow>
              {active.city ? (
                <InfoRow label="Ort">{active.city}</InfoRow>
              ) : null}
            </div>
          </Section>
        ) : null}

        {/* Fordonsfält – endast admin */}
        {isAdmin && organizationId ? (
          <Section
            icon={ListChecks}
            title="Fordonsfält"
            description="Egna uppgifter som visas på alla fordon, t.ex. märke, årsmodell eller färg."
          >
            <VehicleFieldsManager fields={fields} />
          </Section>
        ) : null}

        {/* Om appen */}
        <Section icon={Info} title="Om appen">
          <div className="divide-y divide-line">
            <InfoRow label="Produkt">Fordania Verkstad</InfoRow>
            <InfoRow label="Version">0.1.0</InfoRow>
            <InfoRow label="Syfte">Verkstadsplanering för biluthyrning</InfoRow>
          </div>
        </Section>
      </div>
    </div>
  );
}
