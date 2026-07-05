import { getSession, getActiveOrganizationId } from "@/lib/session";
import { getDashboardData } from "@/lib/data/dashboard";
import { Dashboard } from "@/components/dashboard/dashboard";

const dateFmt = new Intl.DateTimeFormat("sv-SE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** Tidsanpassad hälsning – räknas på servern så klient/server aldrig krockar. */
function greetingFor(hour: number) {
  if (hour < 10) return "God morgon";
  if (hour < 18) return "God dag";
  return "God kväll";
}

function firstName(name?: string | null) {
  const first = name?.trim().split(/\s+/)[0];
  return first || null;
}

export default async function Home() {
  const [session, organizationId] = await Promise.all([
    getSession(),
    getActiveOrganizationId(),
  ]);
  const data = organizationId ? await getDashboardData(organizationId) : null;

  const now = new Date();
  const header = {
    greeting: greetingFor(now.getHours()),
    name: firstName(session?.user.name),
    date: dateFmt.format(now),
  };

  return <Dashboard data={data} hasOrg={!!organizationId} header={header} />;
}
