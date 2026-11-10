"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useTx } from "@/components/console/kit";

/**
 * Create/edit surface. A right-hand sheet on desktop, a full sheet on mobile.
 * System colors only — this is the admin chrome, not the consumer passport.
 */
export function CrmSheet({
  open,
  title,
  onClose,
  children,
  testId,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  testId?: string;
}) {
  const tx = useTx();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/30 md:bg-black/20" aria-label={tx("Close", "Đóng")} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid={testId}
        className="relative flex h-full w-full flex-col bg-white shadow-xl md:max-w-[420px] md:border-l md:border-black/10"
      >
        <div className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3">
          <h2 id={titleId} className="text-[17px] font-semibold tracking-tight text-[#1D1D1F]">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[15px] font-semibold text-[#1F4B66]"
          >
            {tx("Close", "Đóng")}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
