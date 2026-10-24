import { NextResponse } from "next/server";
import { getEnvStatus } from "@/lib/env";

export async function GET() {
  const envStatus = getEnvStatus();

  return NextResponse.json(
    {
      status: "ok",
      product: "TAPTAP",
      phase: "Phase 0 + Playful Explorer UI (UI-001..UI-006)",
      timestamp: new Date().toISOString(),
      environment: {
        mode: envStatus.mode,
        appUrl: envStatus.appUrl,
        publicEnvConfigured: envStatus.publicEnvConfigured,
        serverEnvConfigured: envStatus.serverEnvConfigured,
      },
    },
    { status: 200 }
  );
}
