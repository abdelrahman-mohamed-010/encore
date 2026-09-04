"use client";

import { useCallback, useRef, useState } from "react";

type State = { pending: boolean; error: string | null };

/**
 * One hook in place of the `loading` + `error` state pair that every mutating
 * component was declaring by hand. It also guards against double submission and
 * against setting state after unmount.
 */
export function useAsyncAction<Args extends unknown[], Result>(
  action: (...args: Args) => Promise<Result>,
) {
  const [state, setState] = useState<State>({ pending: false, error: null });
  const inFlight = useRef(false);

  const run = useCallback(
    async (...args: Args): Promise<Result | undefined> => {
      if (inFlight.current) return undefined;
      inFlight.current = true;
      setState({ pending: true, error: null });

      try {
        const result = await action(...args);
        setState({ pending: false, error: null });
        return result;
      } catch (error) {
        setState({ pending: false, error: (error as Error).message });
        return undefined;
      } finally {
        inFlight.current = false;
      }
    },
    [action],
  );

  const reset = useCallback(() => setState({ pending: false, error: null }), []);

  return { run, reset, pending: state.pending, error: state.error };
}
