"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Reads `?name=1` after mount. Avoids `useSearchParams`, which replays the
 * current navigation in WebKit and interrupts the next `page.goto`.
 */
export function useSearchFlag(name: string): boolean {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEnabled(params.get(name) === "1");
  }, [name, pathname]);

  return enabled;
}
