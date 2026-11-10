"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useSearchFlag } from "@/components/passport/use-search-flag";
import { Card3D } from "@/components/ui/card-3d";
import { CardReveal } from "@/components/ui/card-reveal";
import { GouacheArt } from "@/components/ui/gouache-art";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useExplorer } from "@/context/explorer-context";
import {
  DEMO_MERGE_RESULT,
  GUEST_MERGE_ATTEMPTED_KEY,
  GUEST_MERGE_PENDING_KEY,
  mergeGuestProgress,
  mergeSavedMessage,
  readLocalGuestStampCount,
  shouldMergeGuestProgress,
  shouldShowMergeNotice,
} from "@/lib/passport-client";
import type { GuestMergeResult } from "@/types/passport";

let sharedMerge: Promise<GuestMergeResult> | null = null;

function keepCardStill() {}

function mergeGuestProgressOnce(): Promise<GuestMergeResult> {
  if (!sharedMerge) sharedMerge = mergeGuestProgress();
  return sharedMerge;
}

function readCount(key: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const value = Number(window.sessionStorage.getItem(key) ?? "0");
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function readFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Private mode can reject storage writes.
  }
}

function clearStorage(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}

/**
 * After login, merges guest stamps once and tells the player when new ones
 * were saved. Mounted on player pages because `/auth/callback` redirects to `next`.
 * `?merged=1` runs the merge on that landing. `?mock=1` with the flag uses a fixture.
 */
export function GuestMergeNotice() {
  const mergeFlag = useSearchFlag("merged");
  const mock = useSearchFlag("mock");
  const { locale, isAuthenticated, authLoading, hydrated, collectedStamps, session } =
    useExplorer();
  const [result, setResult] = useState<GuestMergeResult | null>(null);
  const [open, setOpen] = useState(false);
  const vi = locale === "vi";

  useLayoutEffect(() => {
    const localCount = readLocalGuestStampCount();
    if (localCount > readCount(GUEST_MERGE_PENDING_KEY)) {
      writeStorage(GUEST_MERGE_PENDING_KEY, String(localCount));
    }
  }, []);

  useEffect(() => {
    if (!hydrated || authLoading || isAuthenticated || !session.isAnonymous) return;
    if (collectedStamps.length === 0) return;
    if (collectedStamps.length > readCount(GUEST_MERGE_PENDING_KEY)) {
      writeStorage(GUEST_MERGE_PENDING_KEY, String(collectedStamps.length));
    }
  }, [
    hydrated,
    authLoading,
    isAuthenticated,
    session.isAnonymous,
    collectedStamps.length,
  ]);

  useEffect(() => {
    const should = shouldMergeGuestProgress({
      mergeFlag,
      authenticated: isAuthenticated,
      authLoading,
      pendingGuestStamps: readCount(GUEST_MERGE_PENDING_KEY),
      attempted: readFlag(GUEST_MERGE_ATTEMPTED_KEY),
    });
    if (!should) return;

    let active = true;
    const task =
      mock && mergeFlag ? Promise.resolve(DEMO_MERGE_RESULT) : mergeGuestProgressOnce();
    task
      .then((next) => {
        if (!active) return;
        writeStorage(GUEST_MERGE_ATTEMPTED_KEY, "1");
        clearStorage(GUEST_MERGE_PENDING_KEY);
        if (!shouldShowMergeNotice(next)) return;
        setResult(next);
        setOpen(true);
      })
      .catch(() => {
        if (!active) return;
        writeStorage(GUEST_MERGE_ATTEMPTED_KEY, "1");
        clearStorage(GUEST_MERGE_PENDING_KEY);
      });

    return () => {
      active = false;
    };
  }, [mergeFlag, mock, isAuthenticated, authLoading]);

  if (!open || !result) return null;

  const message = mergeSavedMessage(result.merged, locale);
  const demo = mock && mergeFlag;

  return (
    <Sheet
      open={open}
      title={message}
      closeLabel={vi ? "Đóng" : "Close"}
      onClose={() => setOpen(false)}
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
        <Button variant="player" onClick={() => setOpen(false)} data-testid="guest-merge-done">
          {vi ? "Xong" : "Done"}
        </Button>
      </div>
    </Sheet>
  );
}
