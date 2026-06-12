import type { ScheduleJob } from "@/lib/data/schedule";

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
