"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseTenantUsage } from "@/server/quota/quota";
import { useSupabase } from "./use-supabase";

export interface TenantSummary { id: string; slug: string; name: string; status: string; is_demo: boolean; role?: string }
type Usage = ReturnType<typeof parseTenantUsage>;

interface TenantCtx {
  tenants: TenantSummary[];
  tenant: TenantSummary | null;
  usage: Usage | null;
  role: string | null;
  isPlatformAdmin: boolean;
  canManageRooms: boolean;
  canEditStations: boolean;
  canManageMembers: boolean;
  canAssignOwner: boolean;
  loading: boolean;
  select: (slug: string) => void;
  refresh: () => Promise<void>;
  href: (path: string) => string;
}

const Ctx = createContext<TenantCtx | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const supabase = useSupabase();
  const params = useSearchParams();
  const router = useRouter();
  const slug = params.get("tenant");
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const me = (await (await fetch("/api/me", { cache: "no-store" })).json()) as { isPlatformAdmin: boolean; tenants: TenantSummary[] };
      setIsPlatformAdmin(me.isPlatformAdmin);
      let list = me.tenants;
      if (me.isPlatformAdmin) {
        const { data } = await supabase.from("tenants").select("id,slug,name,status,is_demo").order("created_at");
        const roles = new Map(me.tenants.map((t) => [t.id, t.role]));
        list = ((data as TenantSummary[]) ?? []).map((t) => ({ ...t, role: roles.get(t.id) }));
      }
      setTenants(list);
      setLoading(false);
    })();
  }, [supabase]);

  const tenant = tenants.find((t) => t.slug === slug) ?? tenants[0] ?? null;

  const refresh = useCallback(async () => {
    if (!tenant) return;
    const { data } = await supabase.rpc("tenant_usage", { p_tenant: tenant.id });
    setUsage(data ? parseTenantUsage(data) : null);
  }, [supabase, tenant]);
  useEffect(() => void refresh(), [refresh]);

  const role = usage?.role ?? tenant?.role ?? null;
  const elevated = role === "platform_admin";
  const value: TenantCtx = {
    tenants,
    tenant,
    usage,
    role,
    isPlatformAdmin,
    canManageRooms: elevated || role === "owner" || role === "admin",
    canEditStations: elevated || role === "owner" || role === "admin" || role === "editor",
    canManageMembers: elevated || role === "owner" || role === "admin",
    canAssignOwner: elevated || role === "owner",
    loading,
    select: (s) => router.push(`?tenant=${encodeURIComponent(s)}`),
    refresh,
    href: (path) => (tenant ? `${path}?tenant=${encodeURIComponent(tenant.slug)}` : path),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTenant() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTenant must be used inside TenantProvider");
  return ctx;
}
