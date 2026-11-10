"use client";

import type { DailyPoint, CrmOverview } from "@/server/crm/aggregate";
import { QuotaPanel } from "@/components/b2b/quota-panel";
import type { QuotaLimits, QuotaUsage } from "@/server/quota/quota";
import { useTx } from "@/components/console/kit";

function formatRate(rate: number | null): string {
  if (rate == null) return "—";
  return `${Math.round(rate * 100)}%`;
}

export function MetricGrid({ overview }: { overview: CrmOverview }) {
  const tx = useTx();
  const items = [
    { label: tx("Taps", "Lượt chạm"), value: overview.taps.toLocaleString("en-US"), testId: "metric-taps" },
    { label: tx("Unique visitors", "Khách khác nhau"), value: overview.uniqueVisitors.toLocaleString("en-US"), testId: "metric-visitors" },
    { label: tx("Stamps collected", "Dấu đã nhận"), value: overview.stampsCollected.toLocaleString("en-US"), testId: "metric-stamps" },
    { label: tx("Completion rate", "Tỷ lệ hoàn thành"), value: formatRate(overview.completionRate), testId: "metric-completion" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.testId} className="rounded-2xl bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]" data-testid={item.testId}>
          <div className="text-[28px] font-semibold tabular-nums tracking-tight text-[#1D1D1F]">{item.value}</div>
          <div className="text-[13px] text-[#6E6E73]">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export function DailyChart({ points }: { points: DailyPoint[] }) {
  const tx = useTx();
  const width = 640;
  const height = 180;
  const pad = 16;
  const max = Math.max(1, ...points.map((point) => Math.max(point.taps, point.stamps)));
  const step = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;
  const y = (value: number) => height - pad - (value / max) * (height - pad * 2);
  const taps = points.map((point, index) => `${pad + index * step},${y(point.taps)}`).join(" ");
  const stamps = points.map((point, index) => `${pad + index * step},${y(point.stamps)}`).join(" ");
  const area = points.length
    ? `M ${pad},${height - pad} L ${taps.replaceAll(" ", " L ")} L ${pad + (points.length - 1) * step},${height - pad} Z`
    : "";
  const totalTaps = points.reduce((sum, point) => sum + point.taps, 0);
  const label = tx(
    `Daily taps and stamps, last ${points.length} days, ${totalTaps} taps`,
    `Lượt chạm và dấu mỗi ngày, ${points.length} ngày, ${totalTaps} lượt chạm`,
  );

  return (
    <figure className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">
      <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[15px] font-semibold text-[#1D1D1F]">{tx("Daily activity", "Hoạt động mỗi ngày")}</span>
        <span className="flex items-center gap-3 text-[12px] text-[#6E6E73]">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#1F4B66]" />{tx("Taps", "Lượt chạm")}</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#34C759]" />{tx("Stamps", "Dấu")}</span>
        </span>
      </figcaption>
      {points.every((point) => point.taps === 0 && point.stamps === 0) ? (
        <p className="py-10 text-center text-[14px] text-[#8E8E93]">{tx("No taps in this period yet.", "Chưa có lượt chạm trong giai đoạn này.")}</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="h-44 w-full">
          <path d={area} fill="#1F4B66" opacity="0.12" />
          <polyline points={taps} fill="none" stroke="#1F4B66" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          <polyline points={stamps} fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      )}
    </figure>
  );
}

export function PlanUsage({
  used,
  limits,
  packageName,
}: {
  used: QuotaUsage;
  limits: QuotaLimits;
  packageName: string | null;
}) {
  const tx = useTx();
  return (
    <section className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">
      <h2 className="mb-3 text-[17px] font-semibold text-[#1D1D1F]">
        {tx("Plan usage", "Mức dùng gói")}
        <span className="ml-2 text-[13px] font-normal text-[#8E8E93]">{packageName ?? "—"}</span>
      </h2>
      <QuotaPanel used={used} limits={limits} />
    </section>
  );
}
