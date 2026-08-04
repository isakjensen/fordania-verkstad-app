import type { Mechanic, ScheduleJob } from "@/lib/data/schedule";
import { statusLabels, priorityLabels } from "./calendar-meta";
import {
  moveJob,
  setJobNote,
  setJobPriority,
  setJobStatus,
  setJobType,
  type ActionResult,
} from "./actions";

export const JOB_TYPES = [
  "Service",
  "Reparation",
  "Besiktning",
  "Däckbyte",
  "Rekond",
  "Felsökning",
];

export const STATUS_VALUES = [
  "planned",
  "in_progress",
  "waiting_parts",
  "done",
  "delayed",
];

export const PRIORITY_VALUES = ["low", "normal", "high"];

const pad = (n: number) => String(n).padStart(2, "0");

export const fmtDate = (d: Date | null) =>
  d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : "";

export const fmtTime = (d: Date | null) =>
  d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : "";

/** "7", "0730", "7:30", "07.30" → { h, m }. Excel-folk skriver på alla sätt. */
function parseTime(value: string): { h: number; m: number } | null {
  const raw = value.trim().replace(/[.\s]/g, ":");
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  let h: number, m: number;
  if (raw.includes(":")) {
    const [a, b = "0"] = raw.split(":");
    h = Number(a);
    m = Number(b);
  } else if (digits.length <= 2) {
    h = Number(digits);
    m = 0;
  } else {
    h = Number(digits.slice(0, digits.length - 2));
    m = Number(digits.slice(-2));
  }
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

/** "2026-08-04", "4/8", "4 aug" – vi tar det enkla och tydliga formatet. */
function parseDate(value: string, fallback: Date): Date | null {
  const raw = value.trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
  if (iso) {
    const d = new Date(fallback);
    d.setFullYear(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  // "4/8" eller "4-8" = dag/månad i innevarande år.
  const short = /^(\d{1,2})[/-](\d{1,2})$/.exec(raw);
  if (short) {
    const d = new Date(fallback);
    d.setMonth(Number(short[2]) - 1, Number(short[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** Matchar fritext mot en lista med etiketter – "pågår", "PÅGÅR", "in_progress". */
function matchValue(
  value: string,
  values: string[],
  labels: Record<string, string>,
): string | null {
  const v = value.trim().toLowerCase();
  if (!v) return null;
  return (
    values.find((x) => x.toLowerCase() === v) ??
    values.find((x) => (labels[x] ?? "").toLowerCase() === v) ??
    null
  );
}

export interface SheetColumn {
  key: string;
  label: string;
  /** Bredd i px – rutnätet har fasta kolumner precis som ett kalkylblad. */
  width: number;
  /** Texten som visas i rutan, och som hamnar i urklipp vid kopiering. */
  read: (job: ScheduleJob) => string;
  /** Saknas den går kolumnen inte att redigera (härledda värden). */
  edit?: (
    job: ScheduleJob,
    value: string,
    ctx: { mechanics: Mechanic[] },
  ) =>
    | { next: ScheduleJob; save: () => Promise<ActionResult> }
    | { error: string };
  /** Val i en rullgardin, som Excels datavalidering. */
  options?: (ctx: { mechanics: Mechanic[] }) => string[];
  /** Tid, datum och mekaniker är schemaändringar – bara för verkstadsadmin. */
  requiresManage?: boolean;
  align?: "right";
}

/** Ny start/slut på ett jobb, med tiden bevarad eller ändrad. */
function reschedule(
  job: ScheduleJob,
  start: Date,
  end: Date,
): { next: ScheduleJob; save: () => Promise<ActionResult> } {
  return {
    next: { ...job, scheduledStart: start, scheduledEnd: end },
    save: () =>
      moveJob(job.id, {
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
      }),
  };
}

export const SHEET_COLUMNS: SheetColumn[] = [
  {
    key: "date",
    label: "Datum",
    width: 108,
    requiresManage: true,
    read: (j) => fmtDate(j.scheduledStart),
    edit: (job, value) => {
      if (!job.scheduledStart || !job.scheduledEnd) {
        return { error: "Ordern saknar tid." };
      }
      const d = parseDate(value, job.scheduledStart);
      if (!d) return { error: "Skriv datum som 2026-08-04." };
      // Flytta hela passet till det nya datumet, klockslagen behålls.
      const start = new Date(job.scheduledStart);
      start.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
      const length = job.scheduledEnd.getTime() - job.scheduledStart.getTime();
      return reschedule(job, start, new Date(start.getTime() + length));
    },
  },
  {
    key: "start",
    label: "Start",
    width: 70,
    requiresManage: true,
    read: (j) => fmtTime(j.scheduledStart),
    edit: (job, value) => {
      if (!job.scheduledStart || !job.scheduledEnd) {
        return { error: "Ordern saknar tid." };
      }
      const t = parseTime(value);
      if (!t) return { error: "Skriv tid som 07:30." };
      const start = new Date(job.scheduledStart);
      start.setHours(t.h, t.m, 0, 0);
      const length = job.scheduledEnd.getTime() - job.scheduledStart.getTime();
      return reschedule(job, start, new Date(start.getTime() + length));
    },
  },
  {
    key: "end",
    label: "Slut",
    width: 70,
    requiresManage: true,
    read: (j) => fmtTime(j.scheduledEnd),
    edit: (job, value) => {
      if (!job.scheduledStart) return { error: "Ordern saknar tid." };
      const t = parseTime(value);
      if (!t) return { error: "Skriv tid som 09:00." };
      const end = new Date(job.scheduledStart);
      end.setHours(t.h, t.m, 0, 0);
      if (end.getTime() <= job.scheduledStart.getTime()) {
        return { error: "Sluttiden måste vara efter starten." };
      }
      return reschedule(job, job.scheduledStart, end);
    },
  },
  {
    key: "hours",
    label: "Tim",
    width: 56,
    align: "right",
    read: (j) =>
      j.scheduledStart && j.scheduledEnd
        ? ((j.scheduledEnd.getTime() - j.scheduledStart.getTime()) / 3600000)
            .toFixed(2)
            .replace(".", ",")
        : "",
  },
  {
    key: "regNo",
    label: "Reg.nr",
    width: 96,
    read: (j) => j.vehicles[0]?.vehicle.regNo ?? "",
  },
  {
    key: "vehicle",
    label: "Fordon",
    width: 170,
    read: (j) => {
      const v = j.vehicles[0]?.vehicle;
      return v ? [v.brand, v.model].filter(Boolean).join(" ") : "";
    },
  },
  {
    key: "customer",
    label: "Kund",
    width: 160,
    read: (j) => j.vehicles[0]?.vehicle.customers[0]?.customer.name ?? "",
  },
  {
    key: "type",
    label: "Typ",
    width: 120,
    read: (j) => j.type,
    options: () => JOB_TYPES,
    edit: (job, value) => {
      const t = JOB_TYPES.find(
        (x) => x.toLowerCase() === value.trim().toLowerCase(),
      );
      if (!t) return { error: `Okänd typ: ${value}` };
      return { next: { ...job, type: t }, save: () => setJobType(job.id, t) };
    },
  },
  {
    key: "mechanic",
    label: "Mekaniker",
    width: 150,
    requiresManage: true,
    read: (j) => j.mechanics.map((m) => m.user.name).join(", "),
    options: (ctx) => ["", ...ctx.mechanics.map((m) => m.name)],
    edit: (job, value, ctx) => {
      const name = value.trim();
      const current = job.mechanics[0];
      if (!name) {
        if (!current)
          return { next: job, save: async () => ({ success: true }) };
        return {
          next: { ...job, mechanics: [] },
          save: () =>
            moveJob(job.id, { fromUserId: current.userId, unassign: true }),
        };
      }
      const mech = ctx.mechanics.find(
        (m) => m.name.toLowerCase() === name.toLowerCase(),
      );
      if (!mech) return { error: `Ingen mekaniker heter ${name}.` };
      if (current?.userId === mech.id) {
        return { next: job, save: async () => ({ success: true }) };
      }
      return {
        next: {
          ...job,
          mechanics: [
            {
              ...(current ?? {
                id: `tmp-${mech.id}`,
                jobId: job.id,
                createdAt: new Date(),
                hourlyRateOreExcl: null,
                hours: null,
                vatRate: 25,
              }),
              userId: mech.id,
              user: { id: mech.id, name: mech.name },
            },
          ],
        },
        save: () =>
          moveJob(job.id, {
            ...(current ? { fromUserId: current.userId } : {}),
            toUserId: mech.id,
          }),
      };
    },
  },
  {
    key: "status",
    label: "Status",
    width: 130,
    read: (j) => statusLabels[j.status] ?? j.status,
    options: () => STATUS_VALUES.map((s) => statusLabels[s] ?? s),
    edit: (job, value) => {
      const s = matchValue(value, STATUS_VALUES, statusLabels);
      if (!s) return { error: `Okänd status: ${value}` };
      return {
        next: { ...job, status: s },
        save: () => setJobStatus(job.id, s),
      };
    },
  },
  {
    key: "priority",
    label: "Prioritet",
    width: 96,
    read: (j) => priorityLabels[j.priority] ?? j.priority,
    options: () => PRIORITY_VALUES.map((p) => priorityLabels[p] ?? p),
    edit: (job, value) => {
      const p = matchValue(value, PRIORITY_VALUES, priorityLabels);
      if (!p) return { error: `Okänd prioritet: ${value}` };
      return {
        next: { ...job, priority: p },
        save: () => setJobPriority(job.id, p),
      };
    },
  },
  {
    key: "note",
    label: "Anteckning",
    width: 320,
    read: (j) => j.description ?? "",
    edit: (job, value) => ({
      next: { ...job, description: value.trim() || null },
      save: () => setJobNote(job.id, value),
    }),
  },
];
