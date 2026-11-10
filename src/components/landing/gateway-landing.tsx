"use client";

import { useState } from "react";
import { Building2, PawPrint, RotateCcw } from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { Button } from "@/components/ui/button";
import { Card3D } from "@/components/ui/card-3d";
import { CardReveal } from "@/components/ui/card-reveal";
import { GouacheArt } from "@/components/ui/gouache-art";
import { LocaleSwitch } from "@/components/ui/locale-switch";
import { TiltButton, TiltProvider } from "@/components/ui/tilt-provider";
import { AppIcon } from "@/components/ui/app-icon";

const DEMO_CARDS = [
  {
    id: "capybara",
    animal: "capybara",
    pastel: "#f4e894",
    accent: "#d97724",
    name: { en: "Capy Chill", vi: "Capy Chill" },
    series: { en: "Saigon pets", vi: "Thú Sài Gòn" },
    fact: {
      en: "Demo card. A capybara in a cape, holding a bánh mì.",
      vi: "Thẻ demo. Capybara khoác áo choàng, cầm bánh mì.",
    },
  },
  {
    id: "elephant",
    animal: "elephant",
    pastel: "#cde6d0",
    accent: "#2f8568",
    name: { en: "Bread Elephant", vi: "Voi bánh mì" },
    series: { en: "Street bites", vi: "Ẩm thực phố" },
    fact: {
      en: "Demo card. An elephant trunk curled around a baguette.",
      vi: "Thẻ demo. Vòi voi cuốn một ổ bánh mì.",
    },
  },
  {
    id: "giraffe",
    animal: "giraffe",
    pastel: "#ffd2b1",
    accent: "#d95b26",
    name: { en: "Leaf Hat", vi: "Hươu nón lá" },
    series: { en: "Sunny walk", vi: "Dạo nắng" },
    fact: {
      en: "Demo card. A giraffe under a conical leaf hat.",
      vi: "Thẻ demo. Hươu cao cổ đội nón lá.",
    },
  },
  {
    id: "orangutan",
    animal: "orangutan",
    pastel: "#d8cfec",
    accent: "#6f42c1",
    name: { en: "Sugarcane Ape", vi: "Đười ươi nước mía" },
    series: { en: "Cool sip", vi: "Giải nhiệt" },
    fact: {
      en: "Demo card. An orangutan with a cup of sugarcane juice.",
      vi: "Thẻ demo. Đười ươi cầm ly nước mía.",
    },
  },
] as const;

export function GatewayLanding() {
  const { locale } = useExplorer();
  const vi = locale === "vi";
  const [index, setIndex] = useState(0);
  const [replayToken, setReplayToken] = useState(0);
  const card = DEMO_CARDS[index] ?? DEMO_CARDS[0];
  if (!card) return null;

  return (
    <TiltProvider>
      <div className="relative min-h-dvh overflow-x-hidden bg-[linear-gradient(180deg,var(--color-gouache-bg),var(--color-gouache-bg-deep))] font-be text-gouache-ink">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-24 h-56 w-56 -translate-x-1/2 rounded-full bg-player-pastel opacity-80 blur-3xl"
        />
        <div className="ui-grain" aria-hidden="true" />
        <div className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-[max(12px,env(safe-area-inset-top))]">
          <header className="flex items-center justify-between gap-3">
            <div className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gouache-line/80 bg-gouache-cream/90 px-3 shadow-card-rest">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-player-accent text-[11px] font-extrabold text-white">
                T
              </span>
              <span className="font-gouache text-[1.15rem] leading-none">TAPTAP</span>
            </div>
            <div className="flex items-center gap-2">
              <TiltButton />
              <LocaleSwitch tone="gouache" />
            </div>
          </header>

          <div className="mt-5">
            <h1 className="font-gouache text-[length:var(--type-large-title)] leading-[1.12] tracking-[-0.02em]">
              {vi ? "Chạm. Sưu tầm." : "Tap. Collect."}
            </h1>
            <p className="mt-1 text-[length:var(--type-body)] leading-snug text-gouache-muted">
              {vi ? "Người chơi hoặc doanh nghiệp." : "Player or business."}
            </p>
          </div>

          <div className="mt-4 grid gap-3">
            <section className="rounded-card-3d border border-[#f0d48a] bg-gouache-cream p-3.5 shadow-card-rest">
              <div className="mb-3 flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-player-pastel text-player-accent">
                  <AppIcon icon={PawPrint} size="md" />
                </span>
                <div>
                  <h2 className="font-gouache text-[length:var(--type-title-3)] leading-[1.15]">
                    {vi ? "Chơi" : "Play"}
                  </h2>
                  <p className="text-[length:var(--type-footnote)] leading-snug text-gouache-muted">
                    {vi ? "Nhận thẻ ở mỗi trạm." : "Collect a card at each stop."}
                  </p>
                </div>
              </div>
              <Button href="/explore" variant="player" data-testid="landing-player-cta">
                {vi ? "Bắt đầu" : "Start"}
              </Button>
            </section>

            <section className="rounded-card-3d border border-business-line bg-business-paper p-3.5 shadow-[0_14px_30px_-18px_rgba(21,32,43,0.45)]">
              <div className="mb-3 flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-[#d7e4ec] text-business-accent">
                  <AppIcon icon={Building2} size="md" />
                </span>
                <div>
                  <h2 className="font-gouache text-[length:var(--type-title-3)] leading-[1.15] text-business-ink">
                    {vi ? "Doanh nghiệp" : "Business"}
                  </h2>
                  <p className="text-[length:var(--type-footnote)] leading-snug text-[#4c6270]">
                    {vi ? "Phòng, trạm và thẻ." : "Rooms, stations, and tags."}
                  </p>
                </div>
              </div>
              <Button href="/b2b" variant="business" data-testid="landing-business-cta">
                {vi ? "Mở" : "Open"}
              </Button>
            </section>
          </div>

          <div className="mt-5 flex flex-1 flex-col items-center pb-2">
            <CardReveal
              play
              replayToken={replayToken}
              name={card.name[locale]}
              series={card.series[locale]}
              skipLabel={vi ? "Bỏ qua" : "Skip"}
              celebrate
              testId="landing-demo-card"
            >
              <Card3D
                name={card.name[locale]}
                series={card.series[locale]}
                code={`DEMO · 0${index + 1}`}
                fact={card.fact[locale]}
                pastel={card.pastel}
                accent={card.accent}
                demoLabel="Demo"
                flipHint={vi ? "Chạm để lật" : "Tap to flip"}
                sheetCloseLabel={vi ? "Đóng" : "Close"}
                idleDemo
                className="h-[220px] w-[156px]"
                art={<GouacheArt animal={card.animal} pastel={card.pastel} />}
              />
            </CardReveal>

            <p className="mt-3 text-center text-[length:var(--type-caption)] text-gouache-muted">
              {vi ? "Demo. Kéo để nghiêng. Chạm để lật." : "Demo. Drag to tilt. Tap to flip."}
            </p>

            <div className="mt-3 flex items-center gap-2" role="group" aria-label={vi ? "Thẻ demo" : "Demo cards"}>
              {DEMO_CARDS.map((item, itemIndex) => {
                const selected = itemIndex === index;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    aria-label={item.name[locale]}
                    onClick={() => {
                      setIndex(itemIndex);
                      setReplayToken((value) => value + 1);
                    }}
                    className={`min-h-11 min-w-11 rounded-full border text-[12px] font-bold ${
                      selected
                        ? "border-transparent text-white"
                        : "border-gouache-line bg-gouache-cream text-gouache-ink"
                    }`}
                    style={selected ? { background: item.accent } : undefined}
                  >
                    {itemIndex + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 w-full max-w-[220px]">
              <Button
                variant="ghost"
                className="min-h-11 text-[15px]"
                onClick={() => setReplayToken((value) => value + 1)}
              >
                <AppIcon icon={RotateCcw} size="sm" />
                {vi ? "Xem lại" : "Replay"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TiltProvider>
  );
}
