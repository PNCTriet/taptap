"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

type SheetProps = {
  open: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function Sheet({ open, title, closeLabel, onClose, children }: SheetProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus();
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="ui-sheet-root">
      <button
        type="button"
        className="ui-sheet-backdrop"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="ui-sheet-panel font-be text-gouache-ink"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gouache-line" />
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2
            id={titleId}
            className="font-gouache text-[length:var(--type-title-3)] leading-[1.2]"
          >
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-gouache-bg px-3 text-[13px] font-semibold"
          >
            {closeLabel}
          </button>
        </div>
        <div className="text-[length:var(--type-body)] leading-snug text-gouache-muted">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
