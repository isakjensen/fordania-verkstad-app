import type { ScheduleJob, Mechanic } from "@/lib/data/schedule";

export type View = "day" | "week";

/** Arbetsdagens längd i tidsrutnätet. */
export const DAY_START = 7;
export const DAY_END = 18;
export const WORK_HOURS = DAY_END - DAY_START;
/** Pixelhöjd per timme i tidsrutnätet (touch-vänligt). */
export const HOUR_H = 60;

export const WEEKDAYS_SHORT = ["mån", "tis", "ons", "tor", "fre", "lör", "sön"];
export const WEEKDAYS_LONG = [
  "Måndag",
  "Tisdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lördag",
  "Söndag",
];
export const MONTHS = [
  "januari", "februari", "mars", "april", "maj", "juni",
  "juli", "augusti", "september", "oktober", "november", "december",
];

export function pad(n: number) {
  return String(n).padStart(2, "0");
}
export function toParam(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function hm(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
/** 0 = måndag … 6 = söndag */
export function isoDow(d: Date) {
  return (d.getDay() + 6) % 7;
}
/** Måndagen i veckan som `d` ligger i (00:00). */
export function startOfWeek(d: Date) {
  const m = new Date(d);
  m.setHours(0, 0, 0, 0);
  m.setDate(m.getDate() - isoDow(m));
  return m;
}
export function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
export function sameDay(a: Date, b: Date) {
  return toParam(a) === toParam(b);
}

export function initialsOf(name: string) {
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

/** Decimaltimme (07.5 = 07:30) för en order-start. */
export function startHourOf(job: ScheduleJob) {
  const s = new Date(job.scheduledStart as Date);
  return s.getHours() + s.getMinutes() / 60;
}
export function durationHoursOf(job: ScheduleJob) {
  if (!job.scheduledStart || !job.scheduledEnd) return 0.5;
  const d =
    (new Date(job.scheduledEnd).getTime() -
      new Date(job.scheduledStart).getTime()) /
    3600000;
  return d > 0 ? d : 0.5;
}

export interface Placed {
  job: ScheduleJob;
  /** källmekaniker för dagvyns kolumn (tom i veckovy) */
  mechId: string;
  top: number;
  height: number;
  lane: number;
  lanes: number;
}

/**
 * Placerar en uppsättning ordrar i en kolumn: vertikal position via tid och
 * sidled-banor (lanes) för överlappande ordrar.
 */
export function layoutColumn(jobs: ScheduleJob[], mechId: string): Placed[] {
  const sorted = [...jobs].sort(
    (a, b) =>
      new Date(a.scheduledStart as Date).getTime() -
      new Date(b.scheduledStart as Date).getTime(),
  );
  // greedy lane-tilldelning
  const laneEnds: number[] = [];
  const assigned = sorted.map((job) => {
    const start = startHourOf(job);
    const end = start + durationHoursOf(job);
    let lane = laneEnds.findIndex((e) => e <= start + 0.001);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }
    return { job, start, end, lane };
  });
  const lanes = Math.max(1, laneEnds.length);
  return assigned.map(({ job, start, lane }) => {
    const top = (clamp(start, DAY_START, DAY_END) - DAY_START) * HOUR_H;
    const height = Math.max(durationHoursOf(job) * HOUR_H - 4, 26);
    return { job, mechId, top, height, lane, lanes };
  });
}

export interface PlacedH {
  job: ScheduleJob;
  /** timmar från DAY_START till orderstart (klampad) */
  startOffset: number;
  /** orderns längd i timmar */
  durH: number;
  sublane: number;
  sublanes: number;
}

/**
 * Placerar en mekanikers ordrar i en vågrät tidslinje (rad): tidsoffset i
 * timmar (upplösningsoberoende, % räknas i komponenten) och staplade
 * underbanor (sublanes) för överlappande ordrar.
 */
export function layoutRow(jobs: ScheduleJob[]): {
  placed: PlacedH[];
  sublanes: number;
} {
  const sorted = [...jobs].sort(
    (a, b) =>
      new Date(a.scheduledStart as Date).getTime() -
      new Date(b.scheduledStart as Date).getTime(),
  );
  const laneEnds: number[] = [];
  const assigned = sorted.map((job) => {
    const start = startHourOf(job);
    const end = start + durationHoursOf(job);
    let lane = laneEnds.findIndex((e) => e <= start + 0.001);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }
    return { job, start, lane };
  });
  const sublanes = Math.max(1, laneEnds.length);
  const placed = assigned.map(({ job, start, lane }) => ({
    job,
    startOffset: clamp(start, DAY_START, DAY_END) - DAY_START,
    durH: durationHoursOf(job),
    sublane: lane,
    sublanes,
  }));
  return { placed, sublanes };
}

/* ------------------------------------------------------------------ *
 *  Gruppering: mekaniker → fordon → arbetsordrar
 * ------------------------------------------------------------------ */

/** Grupp-nyckel för ordrar som saknar fordon eller mekaniker. */
export const UNASSIGNED_KEY = "__unassigned__";
const NO_VEHICLE_KEY = "__novehicle__";

type SchedVehicle = ScheduleJob["vehicles"][number]["vehicle"];

/** En fordonsrad: ett fordon (eller inget) med dess arbetsordrar. */
export interface CalVehicleRow {
  key: string;
  vehicle: SchedVehicle | null;
  jobs: ScheduleJob[];
}

/** En grupp i kalendern: en mekaniker (eller "Ej tilldelade") med fordonsrader. */
export interface CalGroup {
  key: string;
  /** null = samlingsgruppen "Ej tilldelade" högst upp. */
  mech: Mechanic | null;
  rows: CalVehicleRow[];
  orderCount: number;
}

/**
 * Grupperar arbetsordrar mekaniker → fordon → ordrar. Varje tilldelat fordon
 * blir en egen rad under sin mekaniker; ett fordon kan ha flera ordrar. Ordrar
 * som saknar fordon eller mekaniker hamnar i gruppen "Ej tilldelade" högst upp.
 * En order med flera mekaniker syns under var och en av dem (som idag).
 */
export function groupByMechVehicle(
  mechanics: Mechanic[],
  jobs: ScheduleJob[],
): CalGroup[] {
  const mechIds = new Set(mechanics.map((m) => m.id));
  // groupKey → (vehicleKey → rad)
  const buckets = new Map<string, Map<string, CalVehicleRow>>();

  const rowFor = (
    groupKey: string,
    vehKey: string,
    vehicle: SchedVehicle | null,
  ) => {
    let group = buckets.get(groupKey);
    if (!group) {
      group = new Map();
      buckets.set(groupKey, group);
    }
    let row = group.get(vehKey);
    if (!row) {
      row = { key: vehKey, vehicle, jobs: [] };
      group.set(vehKey, row);
    }
    return row;
  };

  for (const job of jobs) {
    const vehicle = job.vehicles[0]?.vehicle ?? null;
    const assignedMechs = job.mechanics.filter((jm) => mechIds.has(jm.userId));
    const placeable = assignedMechs.length > 0 && !!vehicle;

    if (placeable) {
      for (const jm of assignedMechs) {
        rowFor(jm.userId, vehicle!.id, vehicle).jobs.push(job);
      }
    } else {
      const vehKey = vehicle ? vehicle.id : NO_VEHICLE_KEY;
      rowFor(UNASSIGNED_KEY, vehKey, vehicle).jobs.push(job);
    }
  }

  // Fordon i bokstavsordning; rader utan fordon ("Utan fordon") sist.
  const sortRows = (rows: CalVehicleRow[]) =>
    rows.sort((a, b) => {
      if (!a.vehicle) return 1;
      if (!b.vehicle) return -1;
      return a.vehicle.regNo.localeCompare(b.vehicle.regNo, "sv");
    });
  const countOrders = (rows: CalVehicleRow[]) =>
    new Set(rows.flatMap((r) => r.jobs.map((j) => j.id))).size;

  const groups: CalGroup[] = [];

  const unassigned = buckets.get(UNASSIGNED_KEY);
  if (unassigned && unassigned.size) {
    const rows = sortRows([...unassigned.values()]);
    groups.push({
      key: UNASSIGNED_KEY,
      mech: null,
      rows,
      orderCount: countOrders(rows),
    });
  }

  for (const mech of mechanics) {
    const group = buckets.get(mech.id);
    const rows = group ? sortRows([...group.values()]) : [];
    groups.push({ key: mech.id, mech, rows, orderCount: countOrders(rows) });
  }

  return groups;
}
