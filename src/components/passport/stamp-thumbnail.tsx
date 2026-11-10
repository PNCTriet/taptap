"use client";

import { Card3D } from "@/components/ui/card-3d";
import { GouacheArt } from "@/components/ui/gouache-art";
import { StationIllustration } from "@/components/station-artwork";
import type { PassportStampCard } from "@/lib/passport-groups";

const PALETTES = [
  { pastel: "#cde6d0", accent: "#2f8568", animal: "elephant" },
  { pastel: "#ffd2b1", accent: "#d95b26", animal: "giraffe" },
  { pastel: "#f4e894", accent: "#d97724", animal: "capybara" },
  { pastel: "#d8cfec", accent: "#6f42c1", animal: "orangutan" },
] as const;

type Palette = (typeof PALETTES)[number];

export function paletteForStamp(index: number): Palette {
  return PALETTES[index % PALETTES.length] ?? PALETTES[0];
}

export function StampArt({
  stamp,
  pastel,
  animal,
  className = "h-full w-full object-cover",
}: {
  stamp: PassportStampCard;
  pastel: string;
  animal: Palette["animal"];
  className?: string;
}) {
  if (stamp.legacyStationId) {
    return (
      <StationIllustration
        stationIdOrSlug={stamp.legacyStationId}
        variant="stamp"
        className={`!aspect-auto ${className}`}
      />
    );
  }
  if (stamp.imageUrl) {
    return (
      <div
        aria-hidden
        className={`${className} bg-cover bg-center`}
        style={{ backgroundImage: `url(${JSON.stringify(stamp.imageUrl)})` }}
      />
    );
  }
  return (
    <div
      className="flex h-full w-full items-center justify-center overflow-hidden"
      style={{ backgroundColor: pastel }}
    >
      <div className="h-full max-w-full aspect-[200/230] [&_svg]:h-full [&_svg]:w-auto">
        <GouacheArt animal={animal} pastel={pastel} />
      </div>
    </div>
  );
}

export function StampThumbnail({
  stamp,
  index,
  series,
  fact,
  flipHint,
  closeLabel,
  sealLabel,
  sealDetail,
  demo,
  onSelect,
}: {
  stamp: PassportStampCard;
  index: number;
  series: string;
  fact: string;
  flipHint: string;
  closeLabel: string;
  sealLabel: string;
  sealDetail: string;
  demo: boolean;
  onSelect: () => void;
}) {
  const palette = paletteForStamp(index);
  return (
    <Card3D
      name={stamp.name}
      series={series}
      code={stamp.source === "b2b" ? "B2B" : "B2C"}
      fact={fact}
      pastel={palette.pastel}
      accent={palette.accent}
      demoLabel={demo ? "Demo" : undefined}
      flipHint={flipHint}
      sheetCloseLabel={closeLabel}
      stamped
      sealLabel={sealLabel}
      sealDetail={sealDetail}
      onSelect={onSelect}
      className="h-[220px] w-full"
      art={
        <StampArt
          stamp={stamp}
          pastel={palette.pastel}
          animal={palette.animal}
        />
      }
    />
  );
}
