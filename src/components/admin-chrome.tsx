"use client";

import Link from "next/link";
import { Building2, Contact, DoorOpen, ExternalLink, LayoutDashboard, MapPin, Package, Stamp, Tag, Users } from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { useTx } from "@/components/console/kit";
import { CrmFrame, type CrmNavItem } from "@/components/crm/frame";
import { PLAYER_HOME } from "@/lib/routes";

/** Platform admin chrome: sidebar on desktop, tab bar on mobile. */
export function AdminChrome({ children }: { children: React.ReactNode }) {
  const tx = useTx();
  const { locale } = useExplorer();
  const links: CrmNavItem[] = [
    { href: "/admin", label: tx("Overview", "Tổng quan"), icon: LayoutDashboard, exact: true, tab: true },
    { href: "/admin/visitors", label: tx("Visitors", "Khách"), icon: Users, tab: true },
    { href: "/admin/stations", label: tx("Stations", "Trạm"), icon: MapPin, tab: true },
    { href: "/admin/b2b", label: tx("Business", "Doanh nghiệp"), icon: Building2, tab: true },
    { href: "/admin/venues", label: tx("Venues", "Điểm đến"), icon: DoorOpen },
    { href: "/admin/collections", label: tx("Collections", "Bộ sưu tập"), icon: Package },
    { href: "/admin/stamps", label: tx("Stamps", "Con dấu"), icon: Stamp },
    { href: "/admin/tags", label: tx("Tags", "Thẻ"), icon: Tag },
    { href: "/admin/rewards", label: tx("Rewards", "Phần thưởng"), icon: Contact },
    { href: "/admin/b2b/packages", label: tx("Packages", "Gói"), icon: Package },
    { href: "/admin/b2b/tenants", label: tx("Tenants", "Tenant"), icon: Building2 },
  ];

  return (
    <CrmFrame
      product={tx("Admin", "Quản trị")}
      title="TAPTAP"
      links={links}
      moreLabel={tx("More", "Thêm")}
      extra={
        <Link
          href={PLAYER_HOME}
          target="_blank"
          data-testid="open-player-cta"
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-[#1F4B66] px-3 text-[13px] font-semibold text-white"
        >
          {locale === "vi" ? "Mở" : "Open"}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      }
    >
      {children}
    </CrmFrame>
  );
}
