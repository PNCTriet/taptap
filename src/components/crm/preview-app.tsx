"use client";

import { Contact, DoorOpen, Gauge, LayoutDashboard, MapPin, Stamp, Tag, Users } from "lucide-react";
import { aggregateCrm, buildVisitorRows } from "@/server/crm/aggregate";
import { demoActivity } from "@/server/crm/demo-fixture";
import { DailyChart, MetricGrid, PlanUsage } from "@/components/crm/dashboard";
import { CrmFrame, type CrmNavItem } from "@/components/crm/frame";
import { PageHeader } from "@/components/crm/states";
import { VisitorCrm } from "@/components/crm/visitors";
import { useTx } from "@/components/console/kit";

export function PreviewApp({ view }: { view: "dashboard" | "visitors" }) {
  const tx = useTx();
  const { input, people } = demoActivity();
  const overview = aggregateCrm(input);
  const rows = buildVisitorRows(input, people);
  const openId = rows.find((row) => row.completed)?.id ?? rows[0]?.id ?? null;
  const links: CrmNavItem[] = [
    { href: "/dev/crm-preview", label: tx("Overview", "Tổng quan"), icon: LayoutDashboard, exact: true, tab: true },
    { href: "/dev/crm-preview/visitors", label: tx("Visitors", "Khách"), icon: Users, tab: true },
    { href: "/dev/crm-preview#rooms", label: tx("Rooms", "Phòng"), icon: DoorOpen, tab: true },
    { href: "/dev/crm-preview#stations", label: tx("Stations", "Trạm"), icon: MapPin, tab: true },
    { href: "/dev/crm-preview#stamps", label: tx("Stamps", "Con dấu"), icon: Stamp },
    { href: "/dev/crm-preview#tags", label: tx("Tags", "Thẻ"), icon: Tag },
    { href: "/dev/crm-preview#members", label: tx("Members", "Thành viên"), icon: Contact },
    { href: "/dev/crm-preview#plan", label: tx("Plan", "Gói"), icon: Gauge },
  ];

  return (
    <div className="fixed inset-0 z-[80] overflow-auto bg-[#F2F2F7]">
      <CrmFrame
        testId="b2b-shell"
        product={tx("Business", "Doanh nghiệp")}
        title="Demo Toy Studio"
        role="owner"
        links={links}
        moreLabel={tx("More", "Thêm")}
        switcher={<p className="truncate text-[15px] font-semibold">Demo Toy Studio</p>}
      >
        {view === "dashboard" ? (
          <div className="space-y-4" data-testid="b2b-dashboard">
            <PageHeader
              title={tx("Overview", "Tổng quan")}
              subtitle={tx("Demo tenant · last 30 days", "Tenant demo · 30 ngày gần đây")}
              action={<span className="inline-flex min-h-11 items-center rounded-xl bg-[#1F4B66] px-4 text-[15px] font-semibold text-white">{tx("Add station", "Thêm trạm")}</span>}
            />
            <MetricGrid overview={overview} />
            <DailyChart points={overview.daily} />
            <PlanUsage used={{ rooms: 1, stations: 6, members: 3, active_nfc_tags: 6 }} limits={{ rooms: 5, stations: 50, members: 10, active_nfc_tags: 50 }} packageName="Growth" />
          </div>
        ) : (
          <div className="space-y-3">
            <PageHeader
              title={tx("Visitors", "Khách")}
              subtitle={tx("Search, filter, and open a visitor for tap and stamp history.", "Tìm, lọc, và mở khách để xem lịch sử chạm và dấu.")}
              action={<span className="inline-flex min-h-11 items-center rounded-xl bg-[#1F4B66] px-4 text-[15px] font-semibold text-white">{tx("Add station", "Thêm trạm")}</span>}
            />
            <VisitorCrm
              rows={rows}
              taps={input.taps}
              grants={input.grants}
              range={{ from: input.from, to: input.to }}
              timeZone={input.timeZone}
              initialSelected={openId}
            />
          </div>
        )}
      </CrmFrame>
    </div>
  );
}
