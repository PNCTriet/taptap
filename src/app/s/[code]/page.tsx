import React from "react";
import { resolveStationByPublicCode } from "@/server/stations/resolve-station";
import { StationTapSheet } from "@/components/station-tap-sheet";

interface StationRouteProps {
  params: Promise<{ code: string }>;
}

export default async function StationTapPage({ params }: StationRouteProps) {
  const { code } = await params;
  const resolution = await resolveStationByPublicCode(code);

  return <StationTapSheet resolution={resolution} />;
}
