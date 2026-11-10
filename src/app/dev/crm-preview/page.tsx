import { notFound } from "next/navigation";
import { PreviewApp } from "@/components/crm/preview-app";

/** Dev-only frame of the business dashboard. Production 404. No live tenant data. */
export default function CrmPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PreviewApp view="dashboard" />;
}
