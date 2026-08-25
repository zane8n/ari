"use client";

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const platformIsIPad = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || platformIsIPad;
}
