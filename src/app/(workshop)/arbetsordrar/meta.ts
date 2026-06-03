import {
  statusLabels,
  priorityLabels,
  statusMeta,
} from "../planering/calendar-meta";

export { statusLabels, priorityLabels, statusMeta };

export const TYPE_OPTIONS = [
  "Service",
  "Reparation",
  "Besiktning",
  "Däckbyte",
  "Rekond",
  "Felsökning",
].map((t) => ({ value: t, label: t }));

export const STATUS_OPTIONS = Object.entries(statusLabels).map(
  ([value, label]) => ({ value, label }),
);

export const PRIORITY_OPTIONS = Object.entries(priorityLabels).map(
  ([value, label]) => ({ value, label }),
);

export const VAT_OPTIONS = [
  { value: "25", label: "25 %" },
  { value: "12", label: "12 %" },
  { value: "6", label: "6 %" },
];
