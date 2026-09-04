"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";

/**
 * Owns the camera: permission, the decode loop, de-duplication of the same code,
 * and — the part that matters — releasing the stream. Leaving it open keeps the
 * device's camera light on after the operator navigates away, so every exit path
 * (toggle off, decode failure, unmount) runs the same stop.
 *
 * `onDecode` is read through a ref so a caller can pass an inline closure without
 * restarting the camera on every render.
 */
export function useQrScanner({
  onDecode,
  dedupeMs = 2500,
}: {
  onDecode: (payload: string) => void;
  dedupeMs?: number;
}) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const lastPayload = useRef<{ value: string; at: number }>({ value: "", at: 0 });

  const handlerRef = useRef(onDecode);
  useEffect(() => {
    handlerRef.current = onDecode;
  }, [onDecode]);

  useEffect(() => {
    if (!scanning) {
      controlsRef.current?.stop();
      controlsRef.current = null;
      return;
    }

    let cancelled = false;
    const reader = new BrowserQRCodeReader();

    (async () => {
      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result) => {
            if (!result) return;
            const value = result.getText();
            const now = Date.now();
            // A camera fires the same code many times a second.
            if (value === lastPayload.current.value && now - lastPayload.current.at < dedupeMs) {
              return;
            }
            lastPayload.current = { value, at: now };
            handlerRef.current(value);
          },
        );
        if (cancelled) controls.stop();
        else controlsRef.current = controls;
      } catch (cause) {
        if (cancelled) return;
        setError(
          (cause as Error).name === "NotAllowedError"
            ? "Camera access was denied. Enter codes manually instead."
            : "No camera available on this device.",
        );
        setScanning(false);
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [scanning, dedupeMs]);

  const toggle = useCallback(() => {
    setError(null);
    setScanning((on) => !on);
  }, []);

  return { videoRef, scanning, error, toggle };
}
