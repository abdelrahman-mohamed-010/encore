"use client";

import { useSyncExternalStore } from "react";

/**
 * Reads a media query without mirroring it into state inside an effect, so the
 * first client render already agrees with the browser.
 */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
