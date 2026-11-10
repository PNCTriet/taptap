"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useExplorer } from "@/context/explorer-context";
import { usePrefersReducedMotion } from "@/components/ui/use-reduced-motion";

export type GyroSample = {
  active: boolean;
  beta: number | null;
  gamma: number | null;
};

export type TiltPermission = "idle" | "active" | "denied" | "unavailable";

type GyroListener = (sample: GyroSample) => void;

type TiltContextValue = {
  status: TiltPermission;
  reducedMotion: boolean;
  requestGyro: () => Promise<void>;
  subscribe: (listener: GyroListener) => () => void;
};

const IDLE_SAMPLE: GyroSample = { active: false, beta: null, gamma: null };

const fallbackSubscribe = () => () => {};

const TiltContext = createContext<TiltContextValue>({
  status: "idle",
  reducedMotion: false,
  requestGyro: async () => {},
  subscribe: fallbackSubscribe,
});

type DeviceOrientationWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export function TiltProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = usePrefersReducedMotion();
  const [status, setStatus] = useState<TiltPermission>("idle");
  const listeners = useRef(new Set<GyroListener>());
  const sampleRef = useRef<GyroSample>(IDLE_SAMPLE);

  const notify = useCallback(() => {
    const sample = sampleRef.current;
    listeners.current.forEach((listener) => listener(sample));
  }, []);

  const subscribe = useCallback((listener: GyroListener) => {
    listeners.current.add(listener);
    listener(sampleRef.current);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.DeviceOrientationEvent === "undefined") {
      setStatus("unavailable");
    }
  }, []);

  useEffect(() => {
    if (status !== "active") {
      sampleRef.current = IDLE_SAMPLE;
      notify();
      return;
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      sampleRef.current = {
        active: true,
        beta: event.beta,
        gamma: event.gamma,
      };
      notify();
    };

    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
      sampleRef.current = IDLE_SAMPLE;
      notify();
    };
  }, [notify, status]);

  const requestGyro = useCallback(async () => {
    if (reducedMotion) return;
    if (status === "active") {
      setStatus("idle");
      return;
    }

    try {
      const ctor = window.DeviceOrientationEvent as
        | DeviceOrientationWithPermission
        | undefined;
      if (!ctor) {
        setStatus("unavailable");
        return;
      }
      if (typeof ctor.requestPermission === "function") {
        const result = await ctor.requestPermission();
        if (result !== "granted") {
          setStatus("denied");
          return;
        }
      }
      setStatus("active");
    } catch {
      setStatus("denied");
    }
  }, [reducedMotion, status]);

  const value = useMemo(
    () => ({ status, reducedMotion, requestGyro, subscribe }),
    [reducedMotion, requestGyro, status, subscribe],
  );

  return <TiltContext.Provider value={value}>{children}</TiltContext.Provider>;
}

export function useTiltContext(): TiltContextValue {
  return useContext(TiltContext);
}

export function TiltButton({ className = "" }: { className?: string }) {
  const { locale } = useExplorer();
  const { status, requestGyro, reducedMotion } = useTiltContext();
  const label =
    status === "active"
      ? locale === "vi"
        ? "Đang nghiêng"
        : "Tilt on"
      : status === "denied"
        ? locale === "vi"
          ? "Chưa cho nghiêng"
          : "Tilt blocked"
        : locale === "vi"
          ? "Nghiêng"
          : "Tilt";

  return (
    <button
      type="button"
      onClick={() => {
        void requestGyro();
      }}
      aria-pressed={status === "active"}
      disabled={reducedMotion || status === "unavailable"}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-gouache-line bg-gouache-cream px-3 text-[13px] font-semibold text-gouache-ink transition-transform duration-fast ease-out-soft active:scale-[0.97] disabled:opacity-50 ${className}`}
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${
          status === "active" ? "bg-player-accent" : "bg-gouache-muted/50"
        }`}
      />
      {label}
    </button>
  );
}
