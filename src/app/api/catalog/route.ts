import { NextResponse } from "next/server";
import { loadB2cCatalog } from "@/server/catalog/b2c-catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const catalog = await loadB2cCatalog();
  if (!catalog) return NextResponse.json({ ok: false }, { status: 503 });
  return NextResponse.json({ ok: true, ...catalog });
}
