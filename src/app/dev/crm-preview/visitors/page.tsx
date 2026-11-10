import { notFound } from "next/navigation";
import { PreviewApp } from "@/components/crm/preview-app";

/** Dev-only visitor CRM with the detail sheet open. Production 404. */
export default function CrmPreviewVisitorsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PreviewApp view="visitors" />;
}
