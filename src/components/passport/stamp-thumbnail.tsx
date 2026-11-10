"use client";

import Image from "next/image";
import { CollectibleCard } from "@/components/ui/collectible-card";
import { StationIllustration } from "@/components/station-artwork";
import { cardArtSrc, resolveCardArt } from "@/lib/card-art";
import type { PassportStampCard } from "@/lib/passport-groups";

const PALETTES = [
  { pastel: "#cde6d0", accent: "#2f8568" },
  { pastel: "#ffd2b1", accent: "#d95b26" },
  { pastel: "#f4e894", accent: "#d97724" },
  { pastel: "#d8cfec", accent: "#6f42c1" },
] as const;

type Palette = (typeof PALETTES)[number];

export function paletteForStamp(index: number): Palette {
  return PALETTES[index % PALETTES.length] ?? PALETTES[0];
}

export function stampImage(stamp: PassportStampCard): string | null {
  const painted = resolveCardArt(stamp.name, stamp.legacyStationId, stamp.id);
  if (painted) return cardArtSrc(painted, true);
  return null;
}

export function StampArt({
  stamp,
  pastel,
  className = "h-full w-full object-contain",
}: {
  stamp: PassportStampCard;
  pastel: string;
  animal?: string;
  className?: string;
}) {
  const src = stampImage(stamp);
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={800}
        height={1192}
        className={className}
      />
    );
  }
  if (stamp.legacyStationId) {
    return (
      <StationIllustration
        stationIdOrSlug={stamp.legacyStationId}
        variant="stamp"
        className={`!aspect-auto ${className}`}
      />
    );
  }
  const initial = stamp.name.trim().charAt(0).toUpperCase() || "T";
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ background: `linear-gradient(165deg, ${pastel}, #fffdf8)` }}
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-gouache-ink font-gouache text-2xl text-gouache-cream">
        {initial}
      </span>
    </div>
  );
}

export function StampThumbnail({
  stamp,
  index,
  series,
  fact,
  flipHint,
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
    <CollectibleCard
      name={stamp.name}
      series={series}
      fact={fact}
      imageSrc={stampImage(stamp)}
      pastel={palette.pastel}
      accent={palette.accent}
      code={stamp.source === "b2b" ? "B2B" : "B2C"}
      demoLabel={demo ? "Demo" : undefined}
      flipHint={flipHint}
      onSelect={onSelect}
      className="aspect-[2/3] w-full"
    />
  );
}
