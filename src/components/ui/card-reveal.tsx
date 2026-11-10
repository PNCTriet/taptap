"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/components/ui/use-reduced-motion";

type RevealPhase = "ripple" | "intro" | "fly" | "settled";

const MOTES = [
  { dx: "72px", dy: "-48px", color: "#d97724", delay: "0ms" },
  { dx: "-68px", dy: "-36px", color: "#f4e894", delay: "40ms" },
  { dx: "40px", dy: "64px", color: "#2f8568", delay: "80ms" },
  { dx: "-46px", dy: "58px", color: "#d95b26", delay: "20ms" },
  { dx: "8px", dy: "-78px", color: "#6f42c1", delay: "60ms" },
  { dx: "-12px", dy: "76px", color: "#f4e894", delay: "100ms" },
  { dx: "84px", dy: "12px", color: "#d97724", delay: "30ms" },
  { dx: "-86px", dy: "8px", color: "#8fd0c2", delay: "90ms" },
];

type CardRevealProps = {
  play?: boolean;
  replayToken?: number;
  introMs?: number;
  name: string;
  series: string;
  skipLabel: string;
  celebrate?: boolean;
  testId?: string;
  children: ReactNode;
};

export function CardReveal({
  play = false,
  replayToken = 0,
  introMs = 1100,
  name,
  series,
  skipLabel,
  celebrate = false,
  testId,
  children,
}: CardRevealProps) {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<RevealPhase>(play ? "ripple" : "settled");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];

    if (!play || reduced) {
      setPhase("settled");
      return;
    }

    const later = (next: RevealPhase, delay: number) => {
      const id = window.setTimeout(() => setPhase(next), delay);
      timers.current.push(id);
    };

    setPhase("ripple");
    later("intro", 420);
    later("fly", 420 + introMs);
    later("settled", 420 + introMs + 900);

    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
  }, [introMs, play, reduced, replayToken]);

  const skip = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setPhase("fly");
    const id = window.setTimeout(() => setPhase("settled"), 880);
    timers.current.push(id);
  };

  return (
    <div className="ui-reveal" data-state={phase} data-testid={testId}>
      <div className="ui-reveal-rings" aria-hidden="true">
        <span className="ui-ring" />
        <span className="ui-ring" />
        <span className="ui-ring" />
        <span className="ui-reveal-core">NFC</span>
      </div>
      {celebrate ? (
        <div className="ui-reveal-confetti" aria-hidden="true">
          {MOTES.map((mote) => (
            <span
              key={`${mote.dx}-${mote.dy}`}
              className="ui-mote"
              style={{
                ["--dx" as string]: mote.dx,
                ["--dy" as string]: mote.dy,
                background: mote.color,
                animationDelay: mote.delay,
              }}
            />
          ))}
        </div>
      ) : null}
      <div className="ui-reveal-overlay" aria-hidden={phase !== "intro"}>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-player-pastel">
          {series}
        </p>
        <p className="font-gouache text-[length:var(--type-title-2)] leading-[1.12]">{name}</p>
        <div className="w-full space-y-3">
          <div className="ui-reveal-progress" aria-hidden="true">
            <span style={{ animationDuration: `${introMs}ms` }} />
          </div>
          <button
            type="button"
            onClick={skip}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-player-pastel px-4 text-[15px] font-semibold text-gouache-ink"
          >
            {skipLabel}
          </button>
        </div>
      </div>
      <div className="ui-reveal-card">{children}</div>
    </div>
  );
}
