"use client";

import { useCallback, useEffect, useState } from "react";
import { b2bAction, Button, Card, Empty, errorText, Notice, SectionTitle, Select, StatusPill, TextInput, useTx } from "@/components/console/kit";
import { useSupabase } from "./use-supabase";
import { useExplorer } from "@/context/explorer-context";

interface Member { user_id: string; email: string | null; role: string }
interface Invite { id: string; email: string; role: string; status: string }

export function MembersPanel({
  tenantId,
  canManage,
  canAssignOwner,
  onChange,
}: {
  tenantId: string;
  canManage: boolean;
  canAssignOwner: boolean;
  onChange?: () => void;
}) {
  const tx = useTx();
  const { locale, user } = useExplorer();
  const supabase = useSupabase();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const roles = canAssignOwner ? ["owner", "admin", "editor", "viewer"] : ["admin", "editor", "viewer"];

  const load = useCallback(async () => {
    const [m, i] = await Promise.all([
      supabase.from("tenant_members").select("user_id,email,role").eq("tenant_id", tenantId).order("created_at"),
      supabase.from("tenant_invitations").select("id,email,role,status").eq("tenant_id", tenantId).eq("status", "pending"),
    ]);
    setMembers((m.data as Member[]) ?? []);
    setInvites((i.data as Invite[]) ?? []);
  }, [supabase, tenantId]);
  useEffect(() => void load(), [load]);

  const run = async (action: string, body: unknown, ok: string) => {
    try {
      await b2bAction(action, body);
      setMsg({ tone: "success", text: ok });
      await load();
      onChange?.();
      return true;
    } catch (err) {
      setMsg({ tone: "error", text: errorText(err, locale) });
      return false;
    }
  };

  return (
    <Card className="space-y-3" data-testid="members-panel">
      <SectionTitle>{tx("Members", "Thành viên")}</SectionTitle>
      {msg ? <Notice tone={msg.tone} testId="members-msg">{msg.text}</Notice> : null}
      {canManage ? (
        <form
          className="flex flex-wrap gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run("invite-member", { tenantId, email, role }, tx("Invited", "Đã mời"))) setEmail("");
          }}
        >
          <TextInput type="email" required placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="min-w-0 flex-1" data-testid="invite-email" />
          <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-auto" data-testid="invite-role">
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
          <Button type="submit" data-testid="invite-submit">{tx("Invite", "Mời")}</Button>
        </form>
      ) : null}
      <div className="divide-y divide-black/[0.06]">
        {members.length === 0 && invites.length === 0 ? <Empty>{tx("No members", "Chưa có thành viên")}</Empty> : null}
        {members.map((m) => (
          <div key={m.user_id} className="flex flex-wrap items-center gap-2 py-2.5" data-testid="member-row">
            <span className="min-w-0 flex-1 truncate text-[15px] text-[#1D1D1F]">
              {m.email ?? m.user_id.slice(0, 8)}
              {m.user_id === user?.id ? <span className="text-[#8E8E93]"> · {tx("you", "bạn")}</span> : null}
            </span>
            {canManage && (canAssignOwner || m.role !== "owner") ? (
              <>
                <Select value={m.role} className="w-auto min-h-[36px]" onChange={(e) => void run("set-member-role", { tenantId, userId: m.user_id, role: e.target.value }, tx("Role updated", "Đã đổi vai trò"))}>
                  {(canAssignOwner ? roles : ["admin", "editor", "viewer"]).map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
                <Button tone="plain" className="min-h-[36px] px-2 text-[#D70015]" onClick={() => void run("remove-member", { tenantId, userId: m.user_id }, tx("Removed", "Đã xoá"))}>
                  {tx("Remove", "Xoá")}
                </Button>
              </>
            ) : (
              <StatusPill status={m.role} />
            )}
          </div>
        ))}
        {invites.map((i) => (
          <div key={i.id} className="flex items-center gap-2 py-2.5" data-testid="invite-row">
            <span className="min-w-0 flex-1 truncate text-[15px] text-[#6E6E73]">{i.email}</span>
            <StatusPill status="pending" />
            <span className="text-[13px] text-[#8E8E93]">{i.role}</span>
            {canManage ? (
              <Button tone="plain" className="min-h-[36px] px-2" onClick={() => void run("revoke-invitation", { invitationId: i.id }, tx("Revoked", "Đã thu hồi"))}>
                {tx("Revoke", "Thu hồi")}
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
