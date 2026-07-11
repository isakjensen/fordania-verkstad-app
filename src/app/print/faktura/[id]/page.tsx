import { notFound } from "next/navigation";
import { getActiveOrganizationId } from "@/lib/session";
import { getWorkOrderDocument } from "@/lib/data/work-orders";
import { WorkOrderDocument } from "@/components/documents/work-order-document";

export const metadata = { title: "Faktura – utskrift" };

export default async function PrintInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const organizationId = await getActiveOrganizationId();
  const job = organizationId
    ? await getWorkOrderDocument(id, organizationId)
    : null;
  if (!job) notFound();

  return <WorkOrderDocument job={job} kind="invoice" />;
}
