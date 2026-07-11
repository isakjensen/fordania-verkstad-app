import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Wrench,
  Flag,
  Clock,
  CalendarDays,
  Hash,
  Printer,
  ReceiptText,
} from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/ui/back-button";
import { getActiveOrganizationId } from "@/lib/session";
import { getJob, getMechanics } from "@/lib/data/schedule";
import { getVehicleOptions } from "@/lib/data/vehicles";
import { MechanicLinks } from "../mechanic-links";
import { VehicleLinks } from "../vehicle-links";
import { PartList } from "../part-list";
import { WorkOrderImages } from "../work-order-images";
import { WorkOrderActions } from "../work-order-actions";
import { statusMeta, statusLabels, priorityLabels } from "../meta";

export const metadata: Metadata = { title: "Arbetsorder" };

const dtf = new Intl.DateTimeFormat("sv-SE", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
const tf = new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit" });
const df = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "long", year: "numeric" });

export default async function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) notFound();

  const [job, mechOptions, vehicleOptions] = await Promise.all([
    getJob(id, organizationId),
    getMechanics(organizationId),
    getVehicleOptions(organizationId),
  ]);
  if (!job) notFound();

  const meta = statusMeta[job.status];
  const start = job.scheduledStart ? new Date(job.scheduledStart) : null;
  const end = job.scheduledEnd ? new Date(job.scheduledEnd) : null;
  const ref = `#${job.id.slice(-6).toUpperCase()}`;

  const linkedMechanics = job.mechanics.map((m) => ({
    id: m.user.id,
    name: m.user.name,
  }));
  const linkedVehicles = job.vehicles.map((v) => ({
    id: v.vehicle.id,
    regNo: v.vehicle.regNo,
    brand: v.vehicle.brand,
    model: v.vehicle.model,
  }));

  // Bilagor: mappa bild-poster till galleriets format och slå upp reg.nr för
  // de fordon varje bild avser.
  const regByVehicleId = new Map(
    job.vehicles.map((v) => [v.vehicle.id, v.vehicle.regNo]),
  );
  const orderImages = job.images.map((img) => ({
    id: img.id,
    caption: img.caption,
    fileName: img.fileName,
    createdAt: img.createdAt.toISOString(),
    uploadedByName: img.uploadedByName,
    workOrderId: job.id,
    workOrderRef: ref,
    workOrderType: job.type,
    vehicleLabels: img.vehicles
      .map((iv) => regByVehicleId.get(iv.vehicleId))
      .filter((r): r is string => Boolean(r)),
  }));

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-5 sm:px-6 lg:px-8">
      <BackButton fallbackHref="/arbetsordrar" />

      <div className="mt-4 flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
            <Wrench className="size-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-ink">
                {job.type}
              </h1>
              <span className="font-mono text-xs text-muted-foreground">{ref}</span>
            </div>
            <span
              className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta?.badge ?? ""}`}
            >
              <span className={`size-1.5 rounded-full ${meta?.dot ?? "bg-slate-400"}`} />
              {statusLabels[job.status] ?? job.status}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/print/arbetsorder/${job.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "md" }))}
          >
            <Printer className="size-4" />
            Skriv ut
          </a>
          <a
            href={`/print/faktura/${job.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "md" }))}
          >
            <ReceiptText className="size-4" />
            Faktura
          </a>
          <WorkOrderActions
            job={{
              id: job.id,
              type: job.type,
              status: job.status,
              priority: job.priority,
              description: job.description,
              scheduledStart: job.scheduledStart,
              scheduledEnd: job.scheduledEnd,
            }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Uppgifter */}
        <Card>
          <CardHeader tone="brand" title="Uppgifter" />
          <CardBody className="divide-y divide-line py-0">
            <Row icon={Clock} label="Tid">
              {start ? (
                <>
                  {dtf.format(start)} · {tf.format(start)}
                  {end ? `–${tf.format(end)}` : ""}
                </>
              ) : (
                "Ej schemalagd"
              )}
            </Row>
            <Row icon={Wrench} label="Typ">
              {job.type}
            </Row>
            <Row icon={Flag} label="Prioritet">
              {priorityLabels[job.priority] ?? job.priority}
            </Row>
            <Row icon={CalendarDays} label="Skapad">
              {df.format(new Date(job.createdAt))}
            </Row>
            <Row icon={Hash} label="Order-ID">
              <span className="font-mono text-sm">{ref}</span>
            </Row>
          </CardBody>
        </Card>

        <MechanicLinks
          jobId={job.id}
          mechanics={linkedMechanics}
          options={mechOptions.map((m) => ({ id: m.id, name: m.name }))}
        />
        <VehicleLinks
          jobId={job.id}
          vehicles={linkedVehicles}
          options={vehicleOptions}
        />
      </div>

      {job.description ? (
        <div className="mt-5">
          <Card>
            <CardHeader tone="brand" title="Beskrivning" />
            <CardBody>
              <p className="text-sm whitespace-pre-wrap text-ink-soft">
                {job.description}
              </p>
            </CardBody>
          </Card>
        </div>
      ) : null}

      <div className="mt-5">
        <PartList jobId={job.id} parts={job.parts} />
      </div>

      <div className="mt-5">
        <WorkOrderImages
          jobId={job.id}
          images={orderImages}
          vehicles={linkedVehicles}
        />
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Wrench;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className="text-right text-sm font-medium text-ink">{children}</span>
    </div>
  );
}
