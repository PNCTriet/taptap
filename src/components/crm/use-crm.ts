"use client";

import { useEffect, useState } from "react";
import type { CrmGrantEvent, CrmOverview, CrmTapEvent, VisitorRow } from "@/server/crm/aggregate";
import type { QuotaLimits, QuotaUsage } from "@/server/quota/quota";
import { useExplorer } from "@/context/explorer-context";

export interface CrmQuota {
  limits: QuotaLimits;
  used: QuotaUsage;
  packageCode: string | null;
  packageName: string | null;
}

export interface CrmPayload {
  ok: true;
  range: { from: string; to: string };
  timeZone: string;
  truncated: boolean;
  overview: CrmOverview;
  visitors: VisitorRow[];
  taps: CrmTapEvent[];
  grants: CrmGrantEvent[];
  quota: CrmQuota | null;
}

export function useCrmActivity(scope: string | null) {
  const { locale } = useExplorer();
  const [data, setData] = useState<CrmPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(scope));

  useEffect(() => {
    if (!scope) return;
    const controller = new AbortController();
    setLoading(true);
    void fetch(`/api/crm/activity?scope=${encodeURIComponent(scope)}`, { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        const json = (await res.json()) as CrmPayload & { ok?: boolean; code?: string; message?: { en: string; vi: string } };
        if (!res.ok || !json.ok) {
          setData(null);
          setCode(json.code ?? "UNKNOWN");
          setError(locale === "vi" ? json.message?.vi ?? "" : json.message?.en ?? "");
          return;
        }
        setData(json);
        setError(null);
        setCode(null);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        setError(locale === "vi" ? "Không tải được số liệu." : "Could not load analytics.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [scope, locale]);

  return { data, error, code, loading };
}
