import { NextResponse } from "next/server";
import { z } from "zod";
import { publicCodeSchema } from "@/lib/env";
import { getSession } from "@/server/auth/session";
import { mapDbError } from "@/server/quota/errors";

const bodySchema = z.object({ code: publicCodeSchema, source: z.enum(["nfc", "qr"]).default("nfc") });

/** Server-validated, idempotent stamp collection (DB unique constraint per participant). */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "INVALID" }, { status: 422 });
  }
  const { supabase, user } = await getSession();
  if (!supabase || !user) {
    return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  }
  const { data, error } = await supabase.rpc("collect_stamp_by_code", {
    p_code: parsed.data.code.toLowerCase(),
    p_source: parsed.data.source,
  });
  if (error) {
    const mapped = mapDbError(error);
    return NextResponse.json({ ok: false, ...mapped }, { status: mapped.status });
  }
  const result = data as { ok: boolean; status?: string };
  if (!result.ok) {
    return NextResponse.json({ ok: false, code: result.status ?? "UNAVAILABLE" }, { status: 409 });
  }
  return NextResponse.json(result);
}
