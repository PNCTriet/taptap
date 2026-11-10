import { z } from "zod";
import type { QuotaResource } from "@/server/quota/quota";

const uuid = z.string().uuid();
const name = z.string().trim().min(1).max(120);
const text = z.string().trim().max(500).optional().nullable();
const role = z.enum(["owner", "admin", "editor", "viewer"]);
const limit = z.coerce.number().int().min(0).max(100000);

export interface B2bAction {
  rpc: string;
  schema: z.ZodTypeAny;
  toParams: (input: never) => Record<string, unknown>;
  /** Pre-check (UX + defence in depth). The DB trigger is still authoritative. */
  quota?: { resource: QuotaResource; tenantKey: string };
}

function action<S extends z.ZodTypeAny>(
  rpc: string,
  schema: S,
  toParams: (input: z.infer<S>) => Record<string, unknown>,
  quota?: B2bAction["quota"]
): B2bAction {
  return { rpc, schema, toParams: toParams as (input: never) => Record<string, unknown>, quota };
}

/** Whitelisted B2B mutations. Every one is a SECURITY DEFINER RPC with its own role check. */
export const B2B_ACTIONS: Record<string, B2bAction> = {
  // Platform admin
  "upsert-package": action(
    "platform_upsert_package",
    z.object({
      code: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,40}$/),
      name: z.string().trim().min(1).max(80),
      maxRooms: limit, maxStations: limit, maxMembers: limit.min(1), maxActiveNfcTags: limit,
      status: z.enum(["active", "archived"]).default("active"),
    }),
    (i) => ({ p_code: i.code, p_name: i.name, p_max_rooms: i.maxRooms, p_max_stations: i.maxStations,
      p_max_members: i.maxMembers, p_max_active_nfc_tags: i.maxActiveNfcTags, p_status: i.status })
  ),
  "create-tenant": action(
    "platform_create_tenant",
    z.object({
      name,
      slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,60}$/).optional().or(z.literal("")),
      packageCode: z.string().trim().min(2),
      ownerEmail: z.string().trim().email().optional().or(z.literal("")),
      isDemo: z.boolean().default(false),
    }),
    (i) => ({ p_name: i.name, p_slug: i.slug || null, p_package_code: i.packageCode,
      p_owner_email: i.ownerEmail || null, p_is_demo: i.isDemo })
  ),
  "set-tenant-status": action(
    "platform_set_tenant_status",
    z.object({ tenantId: uuid, status: z.enum(["pending", "active", "suspended"]) }),
    (i) => ({ p_tenant: i.tenantId, p_status: i.status })
  ),
  "assign-package": action(
    "platform_assign_package",
    z.object({
      tenantId: uuid,
      packageCode: z.string().trim().min(2),
      overrides: z.record(z.enum(["max_rooms", "max_stations", "max_members", "max_active_nfc_tags"]), limit).default({}),
    }),
    (i) => ({ p_tenant: i.tenantId, p_package_code: i.packageCode, p_quota_overrides: i.overrides })
  ),
  // Tenant
  "invite-member": action(
    "tenant_invite_member",
    z.object({ tenantId: uuid, email: z.string().trim().email(), role }),
    (i) => ({ p_tenant: i.tenantId, p_email: i.email, p_role: i.role }),
    { resource: "members", tenantKey: "tenantId" }
  ),
  "set-member-role": action(
    "tenant_set_member_role",
    z.object({ tenantId: uuid, userId: uuid, role }),
    (i) => ({ p_tenant: i.tenantId, p_user: i.userId, p_role: i.role })
  ),
  "remove-member": action(
    "tenant_remove_member",
    z.object({ tenantId: uuid, userId: uuid }),
    (i) => ({ p_tenant: i.tenantId, p_user: i.userId })
  ),
  "revoke-invitation": action(
    "tenant_revoke_invitation",
    z.object({ invitationId: uuid }),
    (i) => ({ p_invitation: i.invitationId })
  ),
  "create-room": action(
    "tenant_create_room",
    z.object({ tenantId: uuid, name, description: text }),
    (i) => ({ p_tenant: i.tenantId, p_name: i.name, p_description: i.description ?? null }),
    { resource: "rooms", tenantKey: "tenantId" }
  ),
  "update-room": action(
    "tenant_update_room",
    z.object({ roomId: uuid, name, description: text, status: z.enum(["draft", "active", "archived"]) }),
    (i) => ({ p_room: i.roomId, p_name: i.name, p_description: i.description ?? null, p_status: i.status })
  ),
  "delete-room": action("tenant_delete_room", z.object({ roomId: uuid }), (i) => ({ p_room: i.roomId })),
  "create-station": action(
    "tenant_create_station",
    z.object({ tenantId: uuid, roomId: uuid.nullable().optional(), name, description: text }),
    (i) => ({ p_tenant: i.tenantId, p_room: i.roomId ?? null, p_name: i.name, p_description: i.description ?? null }),
    { resource: "stations", tenantKey: "tenantId" }
  ),
  "update-station": action(
    "tenant_update_station",
    z.object({ stationId: uuid, roomId: uuid.nullable().optional(), name, description: text,
      status: z.enum(["active", "maintenance", "inactive"]) }),
    (i) => ({ p_station: i.stationId, p_name: i.name, p_description: i.description ?? null,
      p_status: i.status, p_room: i.roomId ?? null })
  ),
  "create-tag": action(
    "tenant_create_tag",
    z.object({ stationId: uuid, label: text }),
    (i) => ({ p_station: i.stationId, p_label: i.label ?? null })
  ),
  "set-tag-status": action(
    "tenant_set_tag_status",
    z.object({ tagId: uuid, status: z.enum(["active", "disabled", "lost", "replaced"]) }),
    (i) => ({ p_tag: i.tagId, p_status: i.status })
  ),
};
