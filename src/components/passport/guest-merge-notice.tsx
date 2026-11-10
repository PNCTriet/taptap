"use client";

import { useEffect, useState } from "react";
import { useSearchFlag } from "@/components/passport/use-search-flag";
import { Card3D } from "@/components/ui/card-3d";
import { CardReveal } from "@/components/ui/card-reveal";
import { GouacheArt } from "@/components/ui/gouache-art";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useExplorer } from "@/context/explorer-context";
import {
  DEMO_MERGE_RESULT,
  mergeGuestProgress,
  mergeSavedMessage,
  shouldShowMergeNotice,
} from "@/lib/passport-client";
import type { GuestMergeResult } from "@/types/passport";

let sharedMerge: Promise<GuestMergeResult> | null = null;
function mergeOnce(): Promise<GuestMergeResult> {
  if (!sharedMerge) sharedMerge = mergeGuestProgress();
  return sharedMerge;
}

function keepCardStill() {}

/**
 * Tells the player when guest stamps were saved to their account.
 * The merge itself runs server-side (httpOnly guest cookie) from the explorer
 * context right after sign-in, or on /login before redirect; this component only
 * renders the result. `?mock=1&merged=1` shows a fixture.
 */
export function GuestMergeNotice() {
  const mergeFlag = useSearchFlag("merged");
  const mock = useSearchFlag("mock");
  const { locale, mergeNotice, dismissMergeNotice } = useExplorer();
  const [local, setLocal] = useState<GuestMergeResult | null>(null);
  const [localClosed, setLocalClosed] = useState(false);
  const vi = locale === "vi";
  const demo = mock && mergeFlag;

  // `?merged=1` (e.g. a post-sign-in landing) asks the server to merge now.
  // Idempotent: a repeat returns { merged: 0 }; signed-out callers get 401.
  useEffect(() => {
    if (!mergeFlag || mock) return;
    let active = true;
    mergeOnce()
      .then((r) => { if (active) setLocal(r); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [mergeFlag, mock]);

  const result = localClosed
    ? demo ? null : mergeNotice
    : demo
      ? DEMO_MERGE_RESULT
      : local && shouldShowMergeNotice(local)
        ? local
        : mergeNotice;
  const open = !!result && shouldShowMergeNotice(result);
  const close = () => {
    setLocalClosed(true);
    dismissMergeNotice();
  };

  if (!open || !result) return null;

  const message = mergeSavedMessage(result.merged, locale);
  const owned = result.alreadyOwned > 0
    ? vi
      ? `${result.alreadyOwned} con dấu đã có sẵn`
      : `${result.alreadyOwned} already in your account`
    : null;

  return (
    <Sheet
      open={open}
      title={message}
      closeLabel={vi ? "Đóng" : "Close"}
      onClose={close}
      testId="guest-merge-notice"
    >
      <div className="flex flex-col items-center gap-4">
        <CardReveal
          play
          celebrate={false}
          introMs={640}
          name={vi ? "Đã lưu" : "Saved"}
          series={vi ? "Hộ chiếu" : "Passport"}
          skipLabel={vi ? "Bỏ qua" : "Skip"}
          testId="guest-merge-reveal"
        >
          <Card3D
            name={vi ? "Đã lưu" : "Saved"}
            series={vi ? "Hộ chiếu" : "Passport"}
            code={`+${result.merged}`}
            fact={message}
            pastel="#f4e894"
            accent="#d97724"
            demoLabel={demo ? "Demo" : undefined}
            flipHint={vi ? "Hộ chiếu" : "Passport"}
            sheetCloseLabel={vi ? "Đóng" : "Close"}
            onSelect={keepCardStill}
            stamped
            sealLabel={vi ? "ĐÃ LƯU" : "SAVED"}
            className="h-[188px] w-[140px]"
            art={<GouacheArt animal="capybara" pastel="#f4e894" />}
          />
        </CardReveal>
        {owned ? (
          <p data-testid="guest-merge-owned" className="text-xs font-semibold text-[#525D58]">{owned}</p>
        ) : null}
        <Button variant="player" onClick={close} data-testid="guest-merge-done">
          {vi ? "Xong" : "Done"}
        </Button>
      </div>
    </Sheet>
  );
}
