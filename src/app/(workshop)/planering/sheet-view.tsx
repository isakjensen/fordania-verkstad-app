"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Download, Loader2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Mechanic, ScheduleJob } from "@/lib/data/schedule";
import { SHEET_COLUMNS, fmtDate } from "./sheet-columns";
import { WEEKDAYS_LONG, MONTHS, isoDow } from "./calendar-utils";

/** Tidsordning. Ordrar utan tid hamnar sist. */
function sortByStart(jobs: ScheduleJob[]) {
  return [...jobs].sort(
    (a, b) =>
      (a.scheduledStart?.getTime() ?? Infinity) -
      (b.scheduledStart?.getTime() ?? Infinity),
  );
}

/** "Måndag 4 augusti" – rubriken på bandraden mellan dagarna. */
function dayLabel(d: Date | null) {
  if (!d) return "Utan datum";
  const name = WEEKDAYS_LONG[isoDow(d)];
  return `${name.slice(0, 1).toUpperCase()}${name.slice(1)} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

interface CellRef {
  r: number;
  c: number;
}

/** Rektangeln mellan ankaret och den aktiva rutan (som Excels markering). */
function rect(a: CellRef, b: CellRef) {
  return {
    r0: Math.min(a.r, b.r),
    r1: Math.max(a.r, b.r),
    c0: Math.min(a.c, b.c),
    c1: Math.max(a.c, b.c),
  };
}

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

/**
 * Tabellvyn – arbetskalendern som ett kalkylblad.
 *
 * Den finns för att verkstadschefen kommer från Excel, och det han saknar är
 * tre konkreta saker: att se allt samtidigt, att kunna skriva direkt i en ruta,
 * och att kunna göra det med tangentbordet. Vyn ger honom alla tre mot appens
 * riktiga data, så veckan går att redigera utan att öppna en enda dialog.
 *
 * Tangentbordet fungerar som i Excel: piltangenter flyttar markeringen, Tab och
 * Enter går vidare, Shift + pil markerar ett område, F2 eller att bara börja
 * skriva öppnar rutan, Escape ångrar och Ctrl/Cmd + C och V kopierar och
 * klistrar in – även till och från Excel, eftersom urklippet är tabbseparerat.
 *
 * Varje ändring sparas för sig mot samma serveråtgärder som resten av appen
 * använder. Raden uppdateras direkt (optimistiskt) och rullas tillbaka om
 * servern säger nej, så en misslyckad ändring aldrig blir en tyst lögn.
 */
export function SheetView({
  jobs,
  mechanics,
  canManage,
  rangeLabel,
}: {
  jobs: ScheduleJob[];
  mechanics: Mechanic[];
  canManage: boolean;
  rangeLabel: string;
}) {
  // Bladet sorteras i tidsordning när data kommer in – dagbanden bygger på att
  // rader från samma dag ligger efter varandra. Vi sorterar däremot INTE om
  // efter en ändring: skriver man ett nytt datum ska raden ligga kvar under
  // fingret, inte hoppa iväg. Nästa gång servern svarar hamnar den rätt.
  const [rows, setRows] = useState(() => sortByStart(jobs));
  useEffect(() => setRows(sortByStart(jobs)), [jobs]);

  const [active, setActive] = useState<CellRef>({ r: 0, c: 0 });
  const [anchor, setAnchor] = useState<CellRef>({ r: 0, c: 0 });
  const [editing, setEditing] = useState<{
    r: number;
    c: number;
    value: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(0);
  const [flash, setFlash] = useState("");

  const gridRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const cols = SHEET_COLUMNS;
  const maxR = Math.max(0, rows.length - 1);
  const maxC = cols.length - 1;
  const sel = useMemo(() => rect(anchor, active), [anchor, active]);
  const ctx = useMemo(() => ({ mechanics }), [mechanics]);

  /**
   * Dagsummor per datum. Ett kalkylblad utan avbrott blir en enda gröt av
   * rader – här bryts veckan i dagar med en bandrad emellan, och varje dag får
   * sin egen summering. Det är delsummorna Excel-folk själva brukar bygga.
   */
  const days = useMemo(() => {
    const map = new Map<string, { count: number; hours: number }>();
    for (const job of rows) {
      const key = fmtDate(job.scheduledStart);
      const cur = map.get(key) ?? { count: 0, hours: 0 };
      cur.count += 1;
      if (job.scheduledStart && job.scheduledEnd) {
        cur.hours +=
          (job.scheduledEnd.getTime() - job.scheduledStart.getTime()) / 3600000;
      }
      map.set(key, cur);
    }
    return map;
  }, [rows]);

  const editable = useCallback(
    (c: number) => {
      const col = cols[c];
      return !!col.edit && (!col.requiresManage || canManage);
    },
    [cols, canManage],
  );

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      if (editRef.current instanceof HTMLInputElement) {
        editRef.current.select();
      }
    }
  }, [editing]);

  // Håll den markerade rutan i bild när man går utanför kanten med piltangenter.
  useEffect(() => {
    const el = gridRef.current?.querySelector<HTMLElement>(
      `[data-cell="${active.r}-${active.c}"]`,
    );
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  const move = useCallback(
    (dr: number, dc: number, extend = false) => {
      setActive((prev) => {
        const next = {
          r: clamp(prev.r + dr, 0, maxR),
          c: clamp(prev.c + dc, 0, maxC),
        };
        if (!extend) setAnchor(next);
        return next;
      });
    },
    [maxR, maxC],
  );

  /** Skriver ett värde i en ruta: optimistiskt lokalt, sedan mot servern. */
  const commit = useCallback(
    (r: number, c: number, value: string) => {
      const col = cols[c];
      const job = rows[r];
      if (!job || !col.edit) return;
      if (col.requiresManage && !canManage) {
        setError(
          "Bara verkstadens administratörer kan ändra tid och mekaniker.",
        );
        return;
      }
      if (col.read(job) === value.trim()) return;

      const res = col.edit(job, value, ctx);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setError("");
      setRows((prev) => prev.map((j, i) => (i === r ? res.next : j)));
      setPending((n) => n + 1);
      res
        .save()
        .then((out) => {
          if (out && "error" in out) {
            setError(out.error);
            setRows((prev) => prev.map((j, i) => (i === r ? job : j)));
          }
        })
        .catch(() => {
          setError("Ändringen kunde inte sparas.");
          setRows((prev) => prev.map((j, i) => (i === r ? job : j)));
        })
        .finally(() => setPending((n) => n - 1));
    },
    [cols, rows, canManage, ctx],
  );

  const startEdit = useCallback(
    (r: number, c: number, initial?: string) => {
      if (!editable(c)) return;
      const job = rows[r];
      if (!job) return;
      setEditing({ r, c, value: initial ?? cols[c].read(job) });
    },
    [cols, rows, editable],
  );

  /**
   * Stänger redigeringen och sparar.
   *
   * Rutan skickar med sitt eget värde i stället för att vi läser `editing`
   * inne i en state-uppdaterare. React kör uppdateraren under renderingen, och
   * att spara därifrån innebar att både raderna och routern uppdaterades mitt i
   * en annan komponents render – React varnade för precis det.
   */
  const closeEdit = useCallback(
    (
      r: number,
      c: number,
      save: boolean,
      value: string,
      then?: { dr: number; dc: number },
    ) => {
      setEditing(null);
      if (save) commit(r, c, value);
      if (then && (then.dr || then.dc)) move(then.dr, then.dc);
      gridRef.current?.focus();
    },
    [commit, move],
  );

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (editing) return;
      const k = e.key;
      const mod = e.ctrlKey || e.metaKey;

      if (mod && (k === "c" || k === "v" || k === "a")) return; // hanteras nedan
      if (k === "ArrowDown") {
        e.preventDefault();
        move(1, 0, e.shiftKey);
      } else if (k === "ArrowUp") {
        e.preventDefault();
        move(-1, 0, e.shiftKey);
      } else if (k === "ArrowRight") {
        e.preventDefault();
        move(0, 1, e.shiftKey);
      } else if (k === "ArrowLeft") {
        e.preventDefault();
        move(0, -1, e.shiftKey);
      } else if (k === "Tab") {
        e.preventDefault();
        move(0, e.shiftKey ? -1 : 1);
      } else if (k === "Enter") {
        e.preventDefault();
        if (editable(active.c)) startEdit(active.r, active.c);
        else move(e.shiftKey ? -1 : 1, 0);
      } else if (k === "F2") {
        e.preventDefault();
        startEdit(active.r, active.c);
      } else if (k === "Home") {
        e.preventDefault();
        setActive((p) => ({ ...p, c: 0 }));
        setAnchor((p) => ({ ...p, c: 0 }));
      } else if (k === "End") {
        e.preventDefault();
        setActive((p) => ({ ...p, c: maxC }));
        setAnchor((p) => ({ ...p, c: maxC }));
      } else if (k === "Delete" || k === "Backspace") {
        e.preventDefault();
        // Tömmer bara de kolumner där tomt är ett giltigt värde.
        for (let r = sel.r0; r <= sel.r1; r++) {
          for (let c = sel.c0; c <= sel.c1; c++) {
            if (
              editable(c) &&
              (cols[c].key === "note" || cols[c].key === "mechanic")
            ) {
              commit(r, c, "");
            }
          }
        }
      } else if (k.length === 1 && !mod && !e.altKey) {
        // Skriv direkt i rutan, som i Excel.
        if (editable(active.c)) {
          e.preventDefault();
          startEdit(active.r, active.c, k);
        }
      }
    },
    [editing, move, active, editable, startEdit, maxC, sel, cols, commit],
  );

  /** Kopiera markeringen som tabbseparerad text – klistras rakt in i Excel. */
  const onCopy = useCallback(
    (e: React.ClipboardEvent) => {
      if (editing) return;
      const lines: string[] = [];
      for (let r = sel.r0; r <= sel.r1; r++) {
        const job = rows[r];
        if (!job) continue;
        const cells: string[] = [];
        for (let c = sel.c0; c <= sel.c1; c++) cells.push(cols[c].read(job));
        lines.push(cells.join("\t"));
      }
      e.clipboardData.setData("text/plain", lines.join("\n"));
      e.preventDefault();
      setFlash(
        `${sel.r1 - sel.r0 + 1} × ${sel.c1 - sel.c0 + 1} kopierat till urklipp`,
      );
    },
    [editing, sel, rows, cols],
  );

  /** Klistra in från Excel: tabbseparerade rader fyller rutorna från markören. */
  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (editing) return;
      const text = e.clipboardData.getData("text/plain");
      if (!text) return;
      e.preventDefault();
      const grid = text
        .replace(/\r\n?/g, "\n")
        .replace(/\n$/, "")
        .split("\n")
        .map((line) => line.split("\t"));

      let written = 0;
      let skipped = 0;
      grid.forEach((line, dr) => {
        line.forEach((value, dc) => {
          const r = active.r + dr;
          const c = active.c + dc;
          if (r > maxR || c > maxC) return;
          if (!editable(c)) {
            skipped++;
            return;
          }
          commit(r, c, value);
          written++;
        });
      });
      setFlash(
        `${written} rutor uppdaterade${skipped ? `, ${skipped} hoppades över (går inte att ändra)` : ""}`,
      );
    },
    [editing, active, maxR, maxC, editable, commit],
  );

  /** Hela vyn som CSV – öppnas direkt i Excel (semikolon + BOM). */
  const exportCsv = useCallback(() => {
    const esc = (s: string) =>
      /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    const lines = [
      cols.map((c) => esc(c.label)).join(";"),
      ...rows.map((job) => cols.map((c) => esc(c.read(job))).join(";")),
    ];
    const blob = new Blob(["﻿" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arbetskalender-${fmtDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [cols, rows]);

  // Kvittensraden ska inte bli hängande – den tonas bort av sig själv.
  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(""), 4000);
    return () => window.clearTimeout(t);
  }, [flash]);

  const totalWidth = cols.reduce((sum, c) => sum + c.width, 44);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Verktygsrad */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pb-2">
        <p className="text-sm font-semibold text-ink">
          {rows.length} {rows.length === 1 ? "order" : "ordrar"}
          <span className="font-normal text-muted-foreground">
            {" · "}
            {rangeLabel}
          </span>
        </p>
        {pending > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Sparar…
          </span>
        ) : null}
        {flash ? (
          <span className="text-xs font-medium text-success">{flash}</span>
        ) : null}
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download />
            Exportera
          </Button>
        </div>
      </div>

      {/* Rutnätet. tabIndex gör hela bladet till ett tangentbordsmål, precis
          som kalkylbladet i Excel: markeringen lever i rutnätet, inte i varje
          enskild ruta. */}
      <div
        ref={gridRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onCopy={onCopy}
        onPaste={onPaste}
        className="min-h-0 flex-1 overflow-auto rounded-xl border border-line bg-surface outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        <table
          className="border-separate border-spacing-0 text-[0.8rem]"
          style={{ width: totalWidth }}
        >
          <colgroup>
            <col style={{ width: 44 }} />
            {cols.map((c) => (
              <col key={c.key} style={{ width: c.width }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 border-b border-r border-line bg-surface-muted px-2 py-1.5 text-[0.68rem] font-semibold text-muted-foreground">
                #
              </th>
              {cols.map((col, c) => (
                <th
                  key={col.key}
                  className={cn(
                    "sticky top-0 z-20 border-b border-r border-line bg-surface-muted px-2 py-1.5 text-left text-[0.68rem] font-semibold uppercase tracking-[0.06em]",
                    c >= sel.c0 && c <= sel.c1
                      ? "text-brand-700"
                      : "text-muted-foreground",
                    col.align === "right" && "text-right",
                  )}
                >
                  {col.label}
                  {col.requiresManage && !canManage ? " 🔒" : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((job, r) => {
              const dayKey = fmtDate(job.scheduledStart);
              const newDay =
                r === 0 || fmtDate(rows[r - 1].scheduledStart) !== dayKey;
              const day = days.get(dayKey);
              return (
                <Fragment key={job.id}>
                  {/* Bandrad per dag: veckodag, datum och dagens delsumma. Det
                      är den som gör bladet läsbart – utan den rinner veckan
                      ihop till en enda lista där man får leta efter var en dag
                      slutar och nästa börjar. */}
                  {newDay ? (
                    <tr>
                      <th className="sticky left-0 z-10 border-b border-r border-t border-line bg-surface-muted" />
                      <td
                        colSpan={cols.length}
                        className="border-b border-t border-line bg-brand-50/60 px-3 py-1.5 dark:bg-surface-muted"
                      >
                        <span className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-ink">
                          {dayLabel(job.scheduledStart)}
                        </span>
                        {day ? (
                          <span className="ml-2.5 text-[0.72rem] font-medium text-muted-foreground">
                            {day.count} {day.count === 1 ? "order" : "ordrar"} ·{" "}
                            {day.hours.toFixed(1).replace(".", ",")} tim
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ) : null}
                  <tr>
                    {/* Radnummer, som i Excel – och en snabb markering av hela raden */}
                    <th
                      onMouseDown={() => {
                        setAnchor({ r, c: 0 });
                        setActive({ r, c: maxC });
                        gridRef.current?.focus();
                      }}
                      className={cn(
                        "sticky left-0 z-10 border-b border-r border-line px-2 py-1 text-right text-[0.7rem] font-medium tabular-nums",
                        r >= sel.r0 && r <= sel.r1
                          ? "bg-brand-50 text-brand-700"
                          : "bg-surface-muted text-muted-foreground",
                      )}
                    >
                      {r + 1}
                    </th>

                    {cols.map((col, c) => {
                      const isActive = active.r === r && active.c === c;
                      const inSel =
                        r >= sel.r0 &&
                        r <= sel.r1 &&
                        c >= sel.c0 &&
                        c <= sel.c1;
                      const isEditing = editing?.r === r && editing?.c === c;
                      const value = col.read(job);
                      return (
                        <td
                          key={col.key}
                          data-cell={`${r}-${c}`}
                          onMouseDown={(e) => {
                            if (isEditing) return;
                            if (e.shiftKey) setActive({ r, c });
                            else {
                              setActive({ r, c });
                              setAnchor({ r, c });
                            }
                            gridRef.current?.focus();
                          }}
                          onDoubleClick={() => startEdit(r, c)}
                          className={cn(
                            "relative h-7 border-b border-r border-line px-2 py-0.5 align-middle",
                            col.align === "right" && "text-right tabular-nums",
                            !editable(c) &&
                              "bg-surface-muted/40 text-muted-foreground",
                            inSel && !isActive && "bg-brand-50/70",
                            isActive &&
                              "z-10 outline outline-2 -outline-offset-2 outline-brand-500",
                          )}
                        >
                          {isEditing ? (
                            <CellEditor
                              ref={editRef}
                              value={editing.value}
                              options={col.options?.(ctx)}
                              onChange={(v) =>
                                setEditing((cur) =>
                                  cur ? { ...cur, value: v } : cur,
                                )
                              }
                              onDone={(save, dr, dc, v) =>
                                closeEdit(r, c, save, v, { dr, dc })
                              }
                            />
                          ) : (
                            <span className="block truncate">{value}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </Fragment>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={cols.length + 1}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  Inga arbetsordrar i den här perioden.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Statusrad: felet från senaste ändringen, annars tangentbordshjälpen */}
      <div className="flex min-h-[1.75rem] items-center gap-2 pt-2 text-xs">
        {error ? (
          <p className="inline-flex items-center gap-1.5 font-medium text-danger">
            <TriangleAlert className="size-3.5 shrink-0" />
            {error}
          </p>
        ) : (
          <p className="text-muted-foreground">
            Piltangenter flyttar · Enter eller F2 redigerar · Tab nästa ruta ·
            Skift + pil markerar · Ctrl+C / Ctrl+V kopierar och klistrar in mot
            Excel
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Rutans redigeringsläge. Kolumner med fasta värden får en rullgardin (som
 * Excels datavalidering), övriga ett vanligt fält. Tangenterna beter sig som i
 * Excel: Enter sparar och går ner, Tab sparar och går höger, Escape ångrar.
 */
function CellEditor({
  ref,
  value,
  options,
  onChange,
  onDone,
}: {
  ref: React.RefObject<HTMLInputElement | HTMLSelectElement | null>;
  value: string;
  options?: string[];
  onChange: (value: string) => void;
  onDone: (save: boolean, dr: number, dc: number, value: string) => void;
}) {
  // Enter flyttar fokus tillbaka till rutnätet, vilket också utlöser onBlur.
  // Utan spärren hade samma ändring sparats två gånger.
  const done = useRef(false);
  function finish(save: boolean, dr: number, dc: number) {
    if (done.current) return;
    done.current = true;
    onDone(save, dr, dc, value);
  }

  function keys(e: ReactKeyboardEvent<HTMLElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      finish(true, e.shiftKey ? -1 : 1, 0);
    } else if (e.key === "Tab") {
      e.preventDefault();
      finish(true, 0, e.shiftKey ? -1 : 1);
    } else if (e.key === "Escape") {
      e.preventDefault();
      finish(false, 0, 0);
    }
    e.stopPropagation();
  }

  const shared =
    "absolute inset-0 size-full bg-surface px-2 text-[0.8rem] text-ink outline-none ring-2 ring-inset ring-brand-500";

  if (options) {
    return (
      <select
        ref={ref as React.RefObject<HTMLSelectElement>}
        value={options.includes(value) ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={keys}
        onBlur={() => finish(true, 0, 0)}
        className={shared}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o || "—"}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      ref={ref as React.RefObject<HTMLInputElement>}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={keys}
      onBlur={() => finish(true, 0, 0)}
      className={shared}
    />
  );
}
