"use client";

import { useEffect, type RefObject } from "react";
import { usePrefersReducedMotion } from "@/components/ui/use-reduced-motion";
import { useTiltContext, type GyroSample } from "@/components/ui/tilt-provider";

const MAX_TILT = 22;

type UseTiltOptions = {
  /** Gentle idle sway until a pointer or gyro takes over. */
  demo?: boolean;
  /** Set true when a drag should not also count as a click. */
  suppressClickRef?: RefObject<boolean>;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pointToTilt(el: HTMLElement, clientX: number, clientY: number) {
  const rect = el.getBoundingClientRect();
  const dx = clamp((clientX - (rect.left + rect.width / 2)) / (rect.width * 0.5), -1.25, 1.25);
  const dy = clamp((clientY - (rect.top + rect.height / 2)) / (rect.height * 0.5), -1.25, 1.25);
  return { x: -dy * MAX_TILT, y: dx * MAX_TILT };
}

function paint(el: HTMLElement, rotX: number, rotY: number, scale: number) {
  const normX = clamp(rotY / MAX_TILT, -1, 1);
  const normY = clamp(-rotX / MAX_TILT, -1, 1);
  const tiltMagnitude = Math.min(1, Math.hypot(normX, normY));
  const tiltEase = tiltMagnitude * tiltMagnitude * (3 - 2 * tiltMagnitude);
  const holoOpacity = Math.max(0, (tiltMagnitude - 0.25) / 0.75) ** 1.4 * 0.55;

  el.style.setProperty("--rot-x", `${rotX.toFixed(2)}deg`);
  el.style.setProperty("--rot-y", `${rotY.toFixed(2)}deg`);
  el.style.setProperty("--card-scale", scale.toFixed(3));
  el.style.setProperty("--art-x", `${(-normX * 10).toFixed(1)}px`);
  el.style.setProperty("--art-y", `${(-normY * 10).toFixed(1)}px`);
  el.style.setProperty("--glare-x", `${(50 - normX * 36).toFixed(1)}%`);
  el.style.setProperty("--glare-y", `${(48 - normY * 36).toFixed(1)}%`);
  el.style.setProperty("--spec-x", `${(50 + normX * 26 - normY * 12).toFixed(1)}%`);
  el.style.setProperty("--spec-y", `${(50 + normY * 26 - normX * 10).toFixed(1)}%`);
  el.style.setProperty("--spec-angle", `${(126 + normX * 18 - normY * 12).toFixed(1)}deg`);
  el.style.setProperty("--holo-x", `${(50 - normX * 28).toFixed(1)}%`);
  el.style.setProperty("--holo-y", `${(50 - normY * 28).toFixed(1)}%`);
  el.style.setProperty("--holo-angle", `${(118 - normX * 20 + normY * 14).toFixed(1)}deg`);
  el.style.setProperty("--spec-opacity", Math.min(0.95, tiltEase * 1.1).toFixed(3));
  el.style.setProperty("--holo-opacity", holoOpacity.toFixed(3));
  el.style.setProperty("--glare-opacity", (tiltEase * 0.22).toFixed(3));
  el.style.setProperty("--shadow-x", `${(-normX * 16).toFixed(1)}px`);
  el.style.setProperty("--shadow-y", `${(18 + normY * 10).toFixed(1)}px`);
}

/**
 * Pointer tilt with a deviceorientation subscription from TiltProvider.
 * Writes CSS variables on the element. Does not re-render per frame.
 */
export function useTilt(
  nodeRef: RefObject<HTMLElement | null>,
  options: UseTiltOptions = {},
): void {
  const { subscribe } = useTiltContext();
  const reduced = usePrefersReducedMotion();
  const demo = options.demo ?? false;
  const suppressClickRef = options.suppressClickRef;

  useEffect(() => {
    const el = nodeRef.current;
    if (!el) return;

    if (reduced) {
      paint(el, 0, 0, 1);
      return;
    }

    const rot = { x: 0, y: 0 };
    const vel = { x: 0, y: 0 };
    const target = { x: 0, y: 0, scale: 1 };
    let scale = 1;
    let raf = 0;
    let running = false;
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let moved = false;
    let dragging = false;
    let hover = false;
    let gyro = false;
    let baseBeta: number | null = null;
    let baseGamma: number | null = null;

    const kick = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(step);
    };

    const rest = () => {
      target.x = 0;
      target.y = 0;
      target.scale = 1;
      kick();
    };

    const step = (now: number) => {
      if (demo && !dragging && !hover && !gyro) {
        const t = now / 1000;
        target.y = Math.sin(t * 1.25) * 12;
        target.x = Math.cos(t * 0.85) * 8;
        target.scale = 1.02;
      }

      vel.x = (vel.x + (target.x - rot.x) * 0.16) * 0.72;
      vel.y = (vel.y + (target.y - rot.y) * 0.16) * 0.72;
      rot.x = clamp(rot.x + vel.x, -28, 28);
      rot.y = clamp(rot.y + vel.y, -28, 28);
      scale += (target.scale - scale) * 0.2;
      paint(el, rot.x, rot.y, scale);

      const still =
        !demo &&
        !dragging &&
        !hover &&
        !gyro &&
        Math.hypot(vel.x, vel.y) < 0.04 &&
        Math.hypot(target.x - rot.x, target.y - rot.y) < 0.08;

      if (still) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(step);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      dragging = true;
      moved = false;
      hover = false;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      el.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      const isDrag = dragging && event.pointerId === pointerId;
      if (isDrag) {
        if (Math.hypot(event.clientX - startX, event.clientY - startY) > 7) {
          moved = true;
        }
        if (!moved) return;
        const next = pointToTilt(el, event.clientX, event.clientY);
        target.x = next.x;
        target.y = next.y;
        target.scale = 1.03;
        kick();
        return;
      }
      if (event.pointerType === "mouse" && !gyro && !demo) {
        hover = true;
        const next = pointToTilt(el, event.clientX, event.clientY);
        target.x = next.x;
        target.y = next.y;
        target.scale = 1.02;
        kick();
      }
    };

    const endDrag = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== pointerId) return;
      dragging = false;
      pointerId = null;
      if (moved && suppressClickRef) {
        suppressClickRef.current = true;
      }
      if (!gyro) {
        hover = false;
        if (!demo) rest();
      }
    };

    const onLeave = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || dragging) return;
      hover = false;
      if (!gyro && !demo) rest();
    };

    const onSample = (sample: GyroSample) => {
      gyro = sample.active;
      if (!gyro || sample.beta == null || sample.gamma == null) {
        baseBeta = null;
        baseGamma = null;
        if (!dragging && !hover && !demo) rest();
        return;
      }
      if (baseBeta == null || baseGamma == null) {
        baseBeta = sample.beta;
        baseGamma = sample.gamma;
      }
      if (dragging) return;
      const dGamma = clamp(sample.gamma - baseGamma, -30, 30);
      const dBeta = clamp(sample.beta - baseBeta, -30, 30);
      target.y = (dGamma / 30) * MAX_TILT;
      target.x = -(dBeta / 30) * MAX_TILT;
      target.scale = 1.02;
      kick();
    };

    const unsubscribe = subscribe(onSample);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    el.addEventListener("pointerleave", onLeave);
    if (demo) kick();

    return () => {
      cancelAnimationFrame(raf);
      unsubscribe();
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [demo, nodeRef, reduced, subscribe, suppressClickRef]);
}
