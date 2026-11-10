"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { Sheet } from "@/components/ui/sheet";
import { useTilt } from "@/components/ui/use-tilt";
import { usePrefersReducedMotion } from "@/components/ui/use-reduced-motion";

export type Card3DProps = {
  name: string;
  series: string;
  code: string;
  fact: string;
  pastel: string;
  accent: string;
  art: ReactNode;
  className?: string;
  titleAs?: "h1" | "h2";
  flipHint?: string;
  sheetCloseLabel?: string;
  demoLabel?: string;
  stamped?: boolean;
  sealLabel?: string;
  sealDetail?: string;
  sealAnimate?: boolean;
  /** Idle figure-8 until the pointer interacts. */
  idleDemo?: boolean;
  /** Tap opens this handler instead of flipping the card. */
  onSelect?: () => void;
};

export function Card3D({
  name,
  series,
  code,
  fact,
  pastel,
  accent,
  art,
  className = "h-[248px] w-[176px]",
  titleAs = "h2",
  flipHint = "Tap to flip",
  sheetCloseLabel = "Close",
  demoLabel,
  stamped = false,
  sealLabel,
  sealDetail,
  sealAnimate = false,
  idleDemo = false,
  onSelect,
}: Card3DProps) {
  const slotRef = useRef<HTMLDivElement>(null);
  const suppressClickRef = useRef(false);
  const reduced = usePrefersReducedMotion();
  const [flipped, setFlipped] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const toggleLock = useRef(false);

  const openFact = useCallback(() => {
    if (toggleLock.current) return;
    toggleLock.current = true;
    window.requestAnimationFrame(() => {
      toggleLock.current = false;
    });
    if (onSelect) {
      onSelect();
      return;
    }
    if (reduced) {
      setSheetOpen(true);
      return;
    }
    setFlipped((value) => !value);
  }, [onSelect, reduced]);

  useTilt(slotRef, { demo: idleDemo && !reduced, suppressClickRef });

  const TitleTag = titleAs;

  return (
    <>
      <div
        className={`relative ${className}`}
        style={{
          ["--card-pastel" as string]: pastel,
          ["--card-accent" as string]: accent,
          ["--card-glow" as string]: `${pastel}99`,
        }}
      >
      <div
        ref={slotRef}
        className="ui-card-slot"
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={name}
        onClick={() => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          openFact();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFact();
          }
        }}
      >
        <div className="ui-card-shadow" aria-hidden="true" />
        <div className="ui-card-stage">
          <div className="ui-card-tilt">
            <div
              className="ui-card-flipper"
              style={{ ["--flip-y" as string]: flipped ? "180deg" : "0deg" }}
            >
              <CardFront
                name={name}
                series={series}
                flipHint={flipHint}
                demoLabel={demoLabel}
                art={art}
                titleAs={TitleTag}
                stamped={stamped}
                sealLabel={sealLabel}
                sealDetail={sealDetail}
                sealAnimate={sealAnimate}
              />
              <CardBack name={name} code={code} fact={fact} accent={accent} />
            </div>
          </div>
        </div>
      </div>
      </div>
      <Sheet
        open={sheetOpen}
        title={name}
        closeLabel={sheetCloseLabel}
        onClose={() => setSheetOpen(false)}
      >
        <p>{fact}</p>
        <p className="mt-3 font-mono text-[12px] tracking-wide text-gouache-ink">{code}</p>
      </Sheet>
    </>
  );
}

function CardFront({
  name,
  series,
  flipHint,
  demoLabel,
  art,
  titleAs: TitleTag,
  stamped,
  sealLabel,
  sealDetail,
  sealAnimate,
}: {
  name: string;
  series: string;
  flipHint: string;
  demoLabel?: string;
  art: ReactNode;
  titleAs: "h1" | "h2";
  stamped: boolean;
  sealLabel?: string;
  sealDetail?: string;
  sealAnimate: boolean;
}) {
  return (
    <div className="ui-card-face">
      <div className="ui-card-art-window">
        <div className="ui-card-art-media ui-card-art-fill">{art}</div>
      </div>
      {demoLabel ? (
        <span className="absolute left-3 top-3 z-[2] rounded-full bg-gouache-ink px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-gouache-cream">
          {demoLabel}
        </span>
      ) : null}
      <div className="ui-card-nameplate">
        <span className="ui-card-series font-be">{series}</span>
        <TitleTag className="ui-card-name">{name}</TitleTag>
        <span className="ui-card-hint">{flipHint}</span>
      </div>
      <div className="ui-card-texture" />
      <div className="ui-card-holo ui-card-specular" />
      <div className="ui-card-holo ui-card-rainbow" />
      <div className="ui-card-holo ui-card-glare" />
      {stamped && sealLabel ? (
        <div
          data-testid="postmark-seal"
          className={`ui-card-seal ${sealAnimate ? "animate-postmark" : ""}`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-[0.14em]">
            {sealLabel}
          </span>
          {sealDetail ? (
            <span className="font-mono text-[9px] opacity-80">{sealDetail}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CardBack({
  name,
  code,
  fact,
  accent,
}: {
  name: string;
  code: string;
  fact: string;
  accent: string;
}) {
  return (
    <div className="ui-card-face ui-card-face-back font-be">
      <div>
        <p className="font-gouache text-[1.15rem] leading-none text-gouache-ink">TAPTAP</p>
        <p
          className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: accent }}
        >
          {code}
        </p>
      </div>
      <div className="rounded-control border border-gouache-line bg-white/80 px-3 py-3">
        <p className="font-gouache text-[1.05rem] leading-tight text-gouache-ink">{name}</p>
        <p className="mt-2 text-[13px] leading-snug text-[#463831]">{fact}</p>
      </div>
      <p className="text-[11px] font-semibold text-gouache-muted">Tap. Explore. Collect.</p>
      <div className="ui-card-holo ui-card-specular" />
      <div className="ui-card-holo ui-card-glare" />
    </div>
  );
}
