import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  IdCard,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Building2,
  UserRound,
  Contact as ContactIcon,
} from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { BackButton } from "@/components/ui/back-button";
import { getActiveOrganizationId } from "@/lib/session";
import { getCustomer } from "@/lib/data/customers";
import { getVehicleOptions } from "@/lib/data/vehicles";
import { getCustomerImages } from "@/lib/data/attachments";
import { AttachmentGallery } from "@/components/attachments/attachment-gallery";
import { CommentSection } from "../comment-section";
import { CustomerActions } from "../customer-actions";
import { VehicleLinks } from "../vehicle-links";
import { ContactPersons } from "../contact-persons";

export const metadata: Metadata = { title: "Kund" };

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

const df = new Intl.DateTimeFormat("sv-SE", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IdCard;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 break-words text-sm font-medium text-ink">
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) notFound();

  const [customer, vehicleOptions, images] = await Promise.all([
    getCustomer(id, organizationId),
    getVehicleOptions(organizationId),
    getCustomerImages(id, organizationId),
  ]);
  if (!customer) notFound();

  const linkedVehicles = customer.vehicles.map((cv) => ({
    id: cv.vehicle.id,
    regNo: cv.vehicle.regNo,
    brand: cv.vehicle.brand,
    model: cv.vehicle.model,
    odo: cv.vehicle.odometer[0]?.value ?? null,
  }));

  const isCompany = customer.type === "company";
  const primaryContact =
    customer.contacts.find((c) => c.isPrimary) ?? null;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-5 sm:px-6 lg:px-8">
      <BackButton fallbackHref="/kunder" />

      {/* Sidhuvud */}
      <div className="mt-4 flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {isCompany ? (
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <Building2 className="size-7" />
            </span>
          ) : (
            <Avatar initials={initialsOf(customer.name)} size="size-14 text-lg" />
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-ink">
                {customer.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isCompany
                    ? "bg-brand-50 text-brand-700"
                    : "bg-surface-muted text-muted-foreground"
                }`}
              >
                {isCompany ? (
                  <Building2 className="size-3" />
                ) : (
                  <UserRound className="size-3" />
                )}
                {isCompany ? "Företag" : "Privatperson"}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Kund sedan {df.format(customer.createdAt)}
            </p>
          </div>
        </div>
        <CustomerActions customer={customer} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Kontaktuppgifter */}
        <Card className="lg:col-span-2">
          <CardHeader tone="brand" title="Uppgifter" />
          <CardBody className="divide-y divide-line py-0">
            {isCompany ? (
              <>
                <Field
                  icon={Building2}
                  label="Organisationsnummer"
                  value={customer.orgNumber}
                />
                <Field
                  icon={ContactIcon}
                  label="Kontaktperson"
                  value={primaryContact?.name ?? null}
                />
              </>
            ) : (
              <Field
                icon={IdCard}
                label="Personnummer"
                value={customer.personalNumber}
              />
            )}
            <Field icon={Phone} label="Telefon" value={customer.phone} />
            <Field icon={Mail} label="E-post" value={customer.email} />
            <Field icon={MapPin} label="Adress" value={customer.address} />
            <Field
              icon={CalendarDays}
              label="Registrerad"
              value={df.format(customer.createdAt)}
            />
          </CardBody>
        </Card>

        {/* Fordon + kommentarer */}
        <div className="space-y-5 lg:col-span-3">
          <ContactPersons
            customerId={customer.id}
            contacts={customer.contacts}
            isCompany={isCompany}
          />
          <VehicleLinks
            customerId={customer.id}
            vehicles={linkedVehicles}
            options={vehicleOptions}
          />
          <CommentSection
            customerId={customer.id}
            comments={customer.comments}
          />
        </div>
      </div>

      {/* Bilagor – bilder från arbetsordrar där kundens fordon förekommer */}
      <div className="mt-5">
        <Card>
          <CardHeader
            tone="brand"
            title="Bilagor"
            subtitle={`${images.length} ${
              images.length === 1 ? "bild" : "bilder"
            } från arbetsordrar`}
          />
          <CardBody>
            <AttachmentGallery
              images={images}
              emptyText="Inga bilder från arbetsordrar ännu."
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
