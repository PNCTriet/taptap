import React from "react";
import type { LucideIcon, LucideProps } from "lucide-react";

export type AppIconSize = "xs" | "sm" | "md" | "lg";

const ICON_SIZE_PX: Record<AppIconSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
};

export interface AppIconProps extends Omit<LucideProps, "size" | "strokeWidth"> {
  icon: LucideIcon;
  size?: AppIconSize;
  strokeWidth?: number;
}

/**
 * Standardized icon wrapper enforcing uniform stroke width (2.2) and pixel sizing
 * across every screen in TAPTAP.
 */
export function AppIcon({
  icon: IconComponent,
  size = "sm",
  strokeWidth = 2.2,
  className = "",
  ...rest
}: AppIconProps) {
  const px = ICON_SIZE_PX[size];
  return (
    <IconComponent
      width={px}
      height={px}
      strokeWidth={strokeWidth}
      className={`shrink-0 ${className}`.trim()}
      aria-hidden="true"
      {...rest}
    />
  );
}
