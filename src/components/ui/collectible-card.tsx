"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import gsap from "gsap";
import { usePrefersReducedMotion } from "@/components/ui/use-reduced-motion";

const MAX_TILT = 22;

export type CollectibleCardProps = {
  name: string;
  series: string;
  fact: string;
  imageSrc?: string | null;
  pastel?: string;
  accent?: string;
  code?: string;
  demoLabel?: string;
  flipHint: string;
  className?: string;
  titleAs?: "h1" | "h2";
  reveal?: boolean;
  testId?: string;
  onSelect?: () => void;
};

export function CollectibleCard({
  name,
  series,
  fact,
  imageSrc,
  pastel = "#f4e894",
  accent = "#d97724",
  code,
  demoLabel,
  flipHint,
  className = "h-[300px] w-[200px]",
  titleAs = "h2",
  reveal = false,
  testId,
  onSelect,
}: CollectibleCardProps) {
  const reduced = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const rotatorRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ x: 0, y: 0, moved: false });
  const [flipped, setFlipped] = useState(false);
  const [broken, setBroken] = useState(false);
  const [phase, setPhase] = useState<"intro" | "settled">(reveal && !reduced ? "intro" : "settled");
  const Title = titleAs;
  const showImage = Boolean(imageSrc) && !broken;

  useEffect(() => {
    const node = stageRef.current;
    if (!node || reduced || !reveal) {
      setPhase("settled");
      return;
    }
    setPhase("intro");
    const tween = gsap.fromTo(
      node,
      { y: 120, scale: 0.42, rotateZ: -6, opacity: 0 },
      {
        y: 0,
        scale: 1,
        rotateZ: 0,
        opacity: 1,
        duration: 0.88,
        ease: "elastic.out(1, 0.58)",
        onComplete: () => setPhase("settled"),
      },
    );
    return () => {
      tween.kill();
    };
  }, [reduced, reveal]);

  useEffect(() => {
    const rotator = rotatorRef.current;
    if (!rotator) return;
    if (reduced) {
      gsap.set(rotator, { clearProps: "transform" });
      return;
    }
    const tween = gsap.to(rotator, {
      rotateY: flipped ? 180 : 0,
      duration: 0.62,
      ease: "back.out(1.7)",
      overwrite: "auto",
    });
    return () => {
      tween.kill();
    };
  }, [flipped, reduced]);

  const tiltTo = (clientX: number, clientY: number) => {
    const stage = stageRef.current;
    const rotator = rotatorRef.current;
    if (!stage || !rotator || reduced || flipped) return;
    const rect = stage.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width - 0.5) * 2));
    const ny = Math.max(-1, Math.min(1, ((clientY - rect.top) / rect.height - 0.5) * 2));
    gsap.to(rotator, {
      rotateX: -ny * MAX_TILT,
      rotateY: nx * MAX_TILT,
      duration: 0.26,
      ease: "power3.out",
      overwrite: "auto",
    });
  };

  const restTilt = () => {
    const rotator = rotatorRef.current;
    if (!rotator || reduced) return;
    gsap.to(rotator, {
      rotateX: 0,
      rotateY: flipped ? 180 : 0,
      duration: 0.45,
      ease: "power3.out",
      overwrite: "auto",
    });
  };

  const open = () => {
    if (reduced) {
      setFlipped((value) => !value);
      onSelect?.();
      return;
    }
    setFlipped((value) => !value);
    onSelect?.();
  };

  return (
    <div
      className={`relative ${className}`}
      style={{ perspective: reduced ? undefined : "1100px" }}
      data-state={phase}
      data-testid={testId}
    >
      <div
        ref={stageRef}
        className="h-full w-full"
        style={{ ["--card-pastel" as string]: pastel, ["--card-accent" as string]: accent }}
      >
        <button
          type="button"
          className="relative h-full w-full rounded-[26px] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gouache-ink"
          aria-label={name}
          aria-pressed={flipped}
          onPointerDown={(event) => {
            dragRef.current = { x: event.clientX, y: event.clientY, moved: false };
          }}
          onPointerMove={(event) => {
            if (event.buttons !== 1) {
              if (event.pointerType === "mouse") tiltTo(event.clientX, event.clientY);
              return;
            }
            const dx = event.clientX - dragRef.current.x;
            const dy = event.clientY - dragRef.current.y;
            if (Math.hypot(dx, dy) > 7) dragRef.current.moved = true;
            tiltTo(event.clientX, event.clientY);
          }}
          onPointerUp={() => {
            if (dragRef.current.moved) {
              restTilt();
              return;
            }
            open();
          }}
          onPointerLeave={() => restTilt()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              open();
            }
          }}
        >
          <div
            ref={rotatorRef}
            className="relative h-full w-full"
            style={{ transformStyle: reduced ? undefined : "preserve-3d" }}
          >
            <Face hidden={reduced && flipped} flat={reduced}>
              {showImage && imageSrc ? (
                <Image
                  src={imageSrc}
                  alt=""
                  width={800}
                  height={1192}
                  draggable={false}
                  className="h-full w-full rounded-[26px] bg-gouache-cream object-contain shadow-[0_18px_38px_-16px_rgba(44,34,30,0.45)]"
                  onError={() => setBroken(true)}
                />
              ) : (
                <FallbackFace name={name} pastel={pastel} />
              )}
              {demoLabel ? (
                <span className="absolute left-3 top-3 z-[2] rounded-full bg-gouache-ink px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-gouache-cream">
                  {demoLabel}
                </span>
              ) : null}
              <div className="pointer-events-none absolute inset-x-2 bottom-2 z-[2] flex h-[26%] flex-col items-center justify-center text-center">
                <span className="max-w-full truncate rounded-full bg-[var(--card-pastel)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-gouache-ink">
                  {series}
                </span>
                <Title className="mt-1 max-w-full truncate px-2 font-gouache text-[1.15rem] leading-none text-gouache-ink">
                  {name}
                </Title>
                <span className="mt-1 text-[10px] font-semibold text-gouache-muted">{flipHint}</span>
              </div>
            </Face>
            <Face hidden={reduced && !flipped} back flat={reduced}>
              <div
                className="flex h-full w-full flex-col justify-between rounded-[26px] border border-gouache-line px-4 py-4 text-center shadow-[0_18px_38px_-16px_rgba(44,34,30,0.45)]"
                style={{ background: "linear-gradient(165deg, #fffaf0, #faf1de)" }}
              >
                <p className="font-gouache text-[1.15rem] leading-none" style={{ color: accent }}>
                  TAPTAP
                </p>
                {code ? (
                  <p className="font-mono text-[11px] font-semibold tracking-wide text-gouache-muted">{code}</p>
                ) : null}
                <div className="rounded-[18px] border border-gouache-line bg-white/80 px-3 py-3">
                  <p className="font-gouache text-[1.05rem] leading-tight text-gouache-ink">{name}</p>
                  <p className="mt-2 text-[13px] leading-snug text-[#463831]">{fact}</p>
                </div>
                <p className="text-[11px] font-semibold text-gouache-muted">{flipHint}</p>
              </div>
            </Face>
          </div>
        </button>
      </div>
    </div>
  );
}

function Face({
  children,
  back = false,
  hidden = false,
  flat = false,
}: {
  children: ReactNode;
  back?: boolean;
  hidden?: boolean;
  flat?: boolean;
}) {
  return (
    <div
      className="absolute inset-0"
      style={{
        backfaceVisibility: flat ? "visible" : "hidden",
        WebkitBackfaceVisibility: flat ? "visible" : "hidden",
        transform: !flat && back ? "rotateY(180deg)" : undefined,
        opacity: flat && hidden ? 0 : 1,
        transition: "opacity 180ms linear",
        pointerEvents: flat && hidden ? "none" : undefined,
      }}
    >
      {children}
    </div>
  );
}

function FallbackFace({ name, pastel }: { name: string; pastel: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "T";
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center rounded-[26px] border border-gouache-line shadow-[0_18px_38px_-16px_rgba(44,34,30,0.45)]"
      style={{ background: `linear-gradient(165deg, ${pastel}, #fffdf8 68%)` }}
    >
      <span className="grid h-16 w-16 place-items-center rounded-full bg-gouache-ink font-gouache text-[1.75rem] text-gouache-cream">
        {initial}
      </span>
    </div>
  );
}
