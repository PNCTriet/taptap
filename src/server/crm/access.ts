/**
 * Who may read a CRM scope.
 * Tenant owner, admin, editor, and viewer see only their own tenant.
 * Platform admin (app_metadata.platform_role) may read every tenant, the B2C
 * catalog (tenant_id is null), or the combined rollup.
 * The SQL function `crm_activity` repeats this check; this guard runs first
 * so a bad route cannot even ask for another tenant's rows.
 */

const READ_ROLES = new Set(["owner", "admin", "editor", "viewer"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface Membership {
  tenantId: string;
  role: string;
}

export type CrmScopeDecision =
  | { ok: true; scope: "tenant"; tenantId: string }
  | { ok: true; scope: "b2c" | "all" }
  | { ok: false; status: 400 | 403; code: "FORBIDDEN" | "TENANT_REQUIRED" | "INVALID" };

export function resolveCrmScope(input: {
  isPlatformAdmin: boolean;
  memberships: Membership[];
  requested: string | null;
}): CrmScopeDecision {
  const requested = input.requested?.trim() || null;
  const readable = input.memberships.filter((membership) => READ_ROLES.has(membership.role));

  if (requested == null) {
    if (input.isPlatformAdmin) return { ok: true, scope: "all" };
    if (readable.length === 1) return { ok: true, scope: "tenant", tenantId: readable[0]!.tenantId };
    if (readable.length === 0) return { ok: false, status: 403, code: "FORBIDDEN" };
    return { ok: false, status: 400, code: "TENANT_REQUIRED" };
  }

  if (requested === "all" || requested === "b2c") {
    if (!input.isPlatformAdmin) return { ok: false, status: 403, code: "FORBIDDEN" };
    return { ok: true, scope: requested };
  }

  if (!UUID.test(requested)) return { ok: false, status: 400, code: "INVALID" };
  if (input.isPlatformAdmin) return { ok: true, scope: "tenant", tenantId: requested };
  const membership = readable.find((item) => item.tenantId === requested);
  if (!membership) return { ok: false, status: 403, code: "FORBIDDEN" };
  return { ok: true, scope: "tenant", tenantId: membership.tenantId };
}

/** Roles that may see full visitor emails in a tenant CRM. Viewers get masked addresses. */
const FULL_EMAIL_ROLES = new Set(["owner", "admin", "editor"]);

export function shouldMaskEmails(input: {
  isPlatformAdmin: boolean;
  scope: "tenant" | "b2c" | "all";
  role: string | null | undefined;
}): boolean {
  if (input.isPlatformAdmin || input.scope !== "tenant") return false;
  return !FULL_EMAIL_ROLES.has(input.role ?? "");
}

/** `alice@example.com` -> `a***@example.com`. Mirrors the SQL mask in crm_activity. */
export function maskEmail(email: string | null): string | null {
  if (email == null) return null;
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  if (email.slice(1, at) === "***") return email; // already masked by the database
  return `${email[0]}***${email.slice(at)}`;
}
