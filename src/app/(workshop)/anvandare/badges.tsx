const roleMeta: Record<string, { label: string; className: string }> = {
  // owner finns kvar som alias för admin (äldre konton).
  owner: {
    label: "Administratör",
    className: "bg-brand-50 text-brand-700 ring-1 ring-brand-200",
  },
  admin: {
    label: "Administratör",
    className: "bg-brand-50 text-brand-700 ring-1 ring-brand-200",
  },
  member: {
    label: "Användare",
    className: "bg-surface-muted text-muted-foreground ring-1 ring-line",
  },
};

export function RoleBadge({ role }: { role: string }) {
  const meta = roleMeta[role] ?? roleMeta.member;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        active
          ? "bg-success-soft text-success"
          : "bg-surface-muted text-muted-foreground ring-1 ring-line"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          active ? "bg-success" : "bg-muted-foreground"
        }`}
        aria-hidden
      />
      {active ? "Aktiv" : "Inaktiv"}
    </span>
  );
}
