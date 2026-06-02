/**
 * Mockdata för Fordania Verkstad.
 * Domänen är en verkstadsplanerare för en biluthyrningsverksamhet:
 * uthyrningsbilar kommer in för service, reparation, besiktning m.m.
 * och planeras in på verkstadens mekaniker.
 *
 * All data här är statisk och endast till för att bygga upp designen.
 * Funktionalitet kopplas på i ett senare skede.
 */

export type JobStatus =
  | "planned" // inplanerad, ej påbörjad
  | "in_progress" // arbete pågår
  | "waiting_parts" // väntar på delar
  | "done" // klar
  | "delayed"; // försenad / kräver åtgärd

export type JobType =
  | "Service"
  | "Reparation"
  | "Besiktning"
  | "Däckbyte"
  | "Rekond"
  | "Felsökning";

export type Priority = "low" | "normal" | "high";

export interface Mechanic {
  id: string;
  name: string;
  initials: string;
  role: string;
  /** Beläggning 0–1 av dagens kapacitet */
  load: number;
  activeJobs: number;
}

export interface Job {
  id: string;
  /** Registreringsnummer på uthyrningsbilen */
  regNo: string;
  vehicle: string;
  type: JobType;
  status: JobStatus;
  mechanicId: string | null;
  /** Starttid HH:MM */
  start: string;
  /** Beräknad åtgångstid i minuter */
  durationMin: number;
  priority: Priority;
}

export const mechanics: Mechanic[] = [
  {
    id: "m1",
    name: "Johan Sandberg",
    initials: "JS",
    role: "Verkmästare",
    load: 0.82,
    activeJobs: 4,
  },
  {
    id: "m2",
    name: "Amir Haddad",
    initials: "AH",
    role: "Fordonstekniker",
    load: 0.64,
    activeJobs: 3,
  },
  {
    id: "m3",
    name: "Petra Lund",
    initials: "PL",
    role: "Fordonstekniker",
    load: 0.45,
    activeJobs: 2,
  },
  {
    id: "m4",
    name: "Niklas Berg",
    initials: "NB",
    role: "Däck & rekond",
    load: 0.93,
    activeJobs: 5,
  },
  {
    id: "m5",
    name: "Sara Öberg",
    initials: "SÖ",
    role: "Lärling",
    load: 0.3,
    activeJobs: 1,
  },
];

export const jobs: Job[] = [
  {
    id: "j1",
    regNo: "FRD 421",
    vehicle: "Volvo XC60",
    type: "Service",
    status: "in_progress",
    mechanicId: "m1",
    start: "08:00",
    durationMin: 120,
    priority: "normal",
  },
  {
    id: "j2",
    regNo: "FRD 118",
    vehicle: "Volkswagen Transporter",
    type: "Reparation",
    status: "waiting_parts",
    mechanicId: "m2",
    start: "08:30",
    durationMin: 240,
    priority: "high",
  },
  {
    id: "j3",
    regNo: "FRD 905",
    vehicle: "Toyota Corolla",
    type: "Besiktning",
    status: "planned",
    mechanicId: "m3",
    start: "09:15",
    durationMin: 45,
    priority: "normal",
  },
  {
    id: "j4",
    regNo: "FRD 332",
    vehicle: "Tesla Model 3",
    type: "Felsökning",
    status: "delayed",
    mechanicId: "m1",
    start: "09:30",
    durationMin: 90,
    priority: "high",
  },
  {
    id: "j5",
    regNo: "FRD 770",
    vehicle: "Kia Ceed",
    type: "Däckbyte",
    status: "done",
    mechanicId: "m4",
    start: "07:45",
    durationMin: 30,
    priority: "low",
  },
  {
    id: "j6",
    regNo: "FRD 256",
    vehicle: "Mercedes Vito",
    type: "Service",
    status: "in_progress",
    mechanicId: "m2",
    start: "10:00",
    durationMin: 150,
    priority: "normal",
  },
  {
    id: "j7",
    regNo: "FRD 643",
    vehicle: "Audi A4 Avant",
    type: "Rekond",
    status: "planned",
    mechanicId: "m4",
    start: "11:00",
    durationMin: 120,
    priority: "low",
  },
  {
    id: "j8",
    regNo: "FRD 087",
    vehicle: "Ford Transit",
    type: "Reparation",
    status: "planned",
    mechanicId: "m3",
    start: "11:30",
    durationMin: 180,
    priority: "high",
  },
  {
    id: "j9",
    regNo: "FRD 514",
    vehicle: "Volvo V60",
    type: "Besiktning",
    status: "done",
    mechanicId: "m5",
    start: "08:15",
    durationMin: 45,
    priority: "normal",
  },
  {
    id: "j10",
    regNo: "FRD 829",
    vehicle: "Renault Clio",
    type: "Däckbyte",
    status: "delayed",
    mechanicId: "m4",
    start: "10:30",
    durationMin: 30,
    priority: "normal",
  },
];

export interface StatusMeta {
  label: string;
  /** Tailwind-klasser för bakgrund + text på status-badge */
  className: string;
  dot: string;
}

export const statusMeta: Record<JobStatus, StatusMeta> = {
  planned: {
    label: "Inplanerad",
    className: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
  in_progress: {
    label: "Pågår",
    className: "bg-info-soft text-info",
    dot: "bg-info",
  },
  waiting_parts: {
    label: "Väntar på delar",
    className: "bg-warning-soft text-warning",
    dot: "bg-warning",
  },
  done: {
    label: "Klar",
    className: "bg-success-soft text-success",
    dot: "bg-success",
  },
  delayed: {
    label: "Försenad",
    className: "bg-danger-soft text-danger",
    dot: "bg-danger",
  },
};

export function mechanicById(id: string | null): Mechanic | undefined {
  if (!id) return undefined;
  return mechanics.find((m) => m.id === id);
}

/** Härledda nyckeltal till dashboardens översiktskort. */
export const stats = {
  activeJobs: jobs.filter((j) => j.status === "in_progress").length,
  plannedToday: jobs.length,
  doneToday: jobs.filter((j) => j.status === "done").length,
  needsAttention: jobs.filter(
    (j) => j.status === "delayed" || j.status === "waiting_parts",
  ).length,
  fleetReady: 38,
  fleetTotal: 52,
};
