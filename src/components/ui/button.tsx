"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type ButtonVariant = "player" | "business" | "ghost" | "ink";

const VARIANTS: Record<ButtonVariant, string> = {
  player:
    "bg-player-accent text-white shadow-[0_10px_18px_-12px_rgba(217,119,36,0.95)] hover:bg-[#c2641b]",
  business:
    "bg-business-accent text-white shadow-[0_10px_18px_-12px_rgba(21,32,43,0.8)] hover:bg-[#17384c]",
  ink: "bg-gouache-ink text-gouache-cream hover:bg-[#1b1613]",
  ghost:
    "border border-gouache-line bg-gouache-cream/90 text-gouache-ink hover:bg-white",
};

type ButtonProps = {
  variant?: ButtonVariant;
  href?: string;
  className?: string;
  children: ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  "data-testid"?: string;
  "aria-pressed"?: boolean;
};

export function Button({
  variant = "player",
  href,
  className = "",
  children,
  type = "button",
  onClick,
  disabled,
  "data-testid": testId,
  "aria-pressed": ariaPressed,
}: ButtonProps) {
  const classes = [
    "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-[length:var(--type-body)] font-semibold leading-none tracking-[-0.011em] font-be transition-[transform,background-color] duration-instant ease-out-soft active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gouache-ink disabled:opacity-50",
    VARIANTS[variant],
    className,
  ].join(" ");

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        data-testid={testId}
        aria-pressed={ariaPressed}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      aria-pressed={ariaPressed}
    >
      {children}
    </button>
  );
}
