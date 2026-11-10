"use client";

import { useMemo, useState } from "react";
import { filterVisitors, visitorHistory, type CrmGrantEvent, type CrmTapEvent, type VisitorFilter, type VisitorQuery, type VisitorRow, type VisitorSort } from "@/server/crm/aggregate";
import { useTx } from "@/components/console/kit";
import { useExplorer } from "@/context/explorer-context";
import { CrmSheet } from "./sheet";
import { EmptyState } from "./states";

function formatWhen(iso: string | null, locale: "en" | "vi"): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function VisitorCrm({
  rows,
  taps,
  grants,
  range,
  timeZone,
  initialSelected = null,
}: {
  rows: VisitorRow[];
  taps: CrmTapEvent[];
  grants: CrmGrantEvent[];
  range: { from: string; to: string };
  timeZone: string;
  initialSelected?: string | null;
}) {
  const tx = useTx();
  const { locale } = useExplorer();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<VisitorFilter>("all");
  const [sort, setSort] = useState<VisitorSort>("last");
  const [direction, setDirection] = useState<VisitorQuery["direction"]>("desc");
  const [selected, setSelected] = useState<string | null>(initialSelected ?? null);

  const visible = useMemo(
    () => filterVisitors(rows, { search, filter, sort, direction }),
    [rows, search, filter, sort, direction],
  );
  const person = rows.find((row) => row.id === selected) ?? null;
  const history = person ? visitorHistory(person.id, { taps, grants, timeZone, from: range.from, to: range.to }) : null;

  const toggleSort = (key: VisitorSort) => {
    if (sort === key) setDirection((current) => (current === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDirection(key === "name" ? "asc" : "desc");
    }
  };

  return (
    <div className="space-y-3 min-[1280px]:pr-[28rem]">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={tx("Search name or email", "Tìm tên hoặc email")}
          aria-label={tx("Search visitors", "Tìm khách")}
          data-testid="visitor-search"
          className="min-h-11 flex-1 rounded-xl border border-black/10 bg-white px-3 text-[15px] outline-none focus:border-[#1F4B66]"
        />
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as VisitorFilter)}
          aria-label={tx("Filter visitors", "Lọc khách")}
          data-testid="visitor-filter"
          className="min-h-11 rounded-xl border border-black/10 bg-white px-3 text-[15px]"
        >
          <option value="all">{tx("All visitors", "Mọi khách")}</option>
          <option value="completed">{tx("Completed", "Đã xong")}</option>
          <option value="in_progress">{tx("In progress", "Đang chơi")}</option>
          <option value="no_stamps">{tx("No stamps", "Chưa có dấu")}</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={tx("No visitors yet", "Chưa có khách")}
          body={tx("Taps and stamp grants will show up here.", "Lượt chạm và dấu nhận sẽ hiện ở đây.")}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={tx("No matches", "Không khớp")}
          body={tx("Try a different name, email, or filter.", "Thử tên, email, hoặc bộ lọc khác.")}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[14px]">
              <thead className="bg-[#F2F2F7] text-[12px] uppercase tracking-wide text-[#6E6E73]">
                <tr>
                  <th className="px-4 py-2 font-semibold">
                    <button type="button" className="min-h-11" onClick={() => toggleSort("name")}>{tx("Visitor", "Khách")}</button>
                  </th>
                  <th className="px-3 py-2 font-semibold">
                    <button type="button" className="min-h-11" onClick={() => toggleSort("taps")}>{tx("Taps", "Chạm")}</button>
                  </th>
                  <th className="px-3 py-2 font-semibold">
                    <button type="button" className="min-h-11" onClick={() => toggleSort("stamps")}>{tx("Stamps", "Dấu")}</button>
                  </th>
                  <th className="px-3 py-2 font-semibold">
                    <button type="button" className="min-h-11" onClick={() => toggleSort("last")}>{tx("Last visit", "Lần cuối")}</button>
                  </th>
                  <th className="px-4 py-2 font-semibold">{tx("Status", "Trạng thái")}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr
                    key={row.id}
                    data-testid="visitor-row"
                    className="cursor-pointer border-t border-black/[0.06] hover:bg-[#F2F7FF]"
                    onClick={() => setSelected(row.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#1D1D1F]">{row.name}</div>
                      <div className="text-[12px] text-[#8E8E93]">{row.email ?? tx("No email", "Không email")}</div>
                    </td>
                    <td className="px-3 py-3 tabular-nums">{row.taps}</td>
                    <td className="px-3 py-3 tabular-nums">{row.stamps}</td>
                    <td className="px-3 py-3 text-[#6E6E73]">{formatWhen(row.lastAt, locale)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${row.completed ? "bg-[#E8F8EE] text-[#1A7F37]" : "bg-[#F2F2F7] text-[#6E6E73]"}`}>
                        {row.completed ? tx("Completed", "Đã xong") : tx("In progress", "Đang chơi")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CrmSheet open={Boolean(person)} title={person?.name ?? ""} onClose={() => setSelected(null)} testId="visitor-detail">
        {person && history ? (
          <div className="space-y-5">
            <p className="text-[13px] text-[#6E6E73]">
              {person.email ?? tx("No email on file", "Chưa có email")}
              {" · "}
              {person.lifetimeStamps} {tx("stamps held", "dấu đang giữ")}
            </p>
            <section>
              <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-[#8E8E93]">{tx("Taps", "Lượt chạm")}</h3>
              {history.taps.length === 0 ? (
                <p className="text-[14px] text-[#8E8E93]">{tx("No taps in this period.", "Không có lượt chạm trong giai đoạn này.")}</p>
              ) : (
                <ul className="divide-y divide-black/[0.06]">
                  {history.taps.map((tap, index) => (
                    <li key={`${tap.at}-${index}`} className="flex items-baseline justify-between gap-3 py-2 text-[14px]">
                      <span className="text-[#1D1D1F]">{tap.stationName ?? tx("Station", "Trạm")}</span>
                      <span className="shrink-0 text-[12px] text-[#8E8E93]">
                        {formatWhen(tap.at, locale)} · {tap.source ?? "nfc"}
                        {tap.granted ? ` · ${tx("new stamp", "dấu mới")}` : ` · ${tx("repeat", "chạm lại")}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-[#8E8E93]">{tx("Stamps", "Con dấu")}</h3>
              {history.stamps.length === 0 ? (
                <p className="text-[14px] text-[#8E8E93]">{tx("No stamps in this period.", "Không có dấu trong giai đoạn này.")}</p>
              ) : (
                <ul className="divide-y divide-black/[0.06]">
                  {history.stamps.map((stamp, index) => (
                    <li key={`${stamp.at}-${index}`} className="py-2 text-[14px]">
                      <div className="font-medium text-[#1D1D1F]">{stamp.stampName ?? tx("Stamp", "Dấu")}</div>
                      <div className="text-[12px] text-[#8E8E93]">{stamp.stationName} · {formatWhen(stamp.at, locale)} · {stamp.source ?? "nfc"}</div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </CrmSheet>
    </div>
  );
}
