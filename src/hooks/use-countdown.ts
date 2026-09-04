"use client";

import { useEffect, useState } from "react";

/**
 * Milliseconds remaining until `deadline`, ticking once a second and calling
 * `onExpire` exactly once when it runs out.
 *
 * Replaces the interval + expiry-latch + state trio that checkout was carrying
 * inline, and guarantees the callback cannot double-fire across re-renders.
 */
export function useCountdown(deadline: string | Date | null, onExpire?: () => void) {
  const target = deadline ? new Date(deadline).getTime() : null;
  const [msLeft, setMsLeft] = useState(() => (target ? target - Date.now() : 0));

  useEffect(() => {
    if (target === null) return;

    let fired = false;
    const tick = () => {
      const remaining = target - Date.now();
      setMsLeft(remaining);
      if (remaining <= 0 && !fired) {
        fired = true;
        onExpire?.();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // onExpire is intentionally not a dependency: callers pass an inline
    // closure, and re-subscribing every render would restart the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return {
    msLeft: Math.max(0, msLeft),
    expired: target !== null && msLeft <= 0,
  };
}
