import React from "react";
import { ZooGpsMap } from "@/components/zoo-gps-map";

interface MapPageProps {
  searchParams: Promise<{ station?: string }>;
}

export default async function MapPage({ searchParams }: MapPageProps) {
  const { station } = await searchParams;

  return (
    <div className="space-y-6">
      <ZooGpsMap initialStationSlug={station} />
    </div>
  );
}
