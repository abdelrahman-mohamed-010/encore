"use client";

import { useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * A text input bound to a URL search param, debounced so typing doesn't fire
 * a server round-trip per keystroke. Any other param (a status/role select,
 * a page number) can be updated immediately alongside it — the whole point
 * is that the table body re-renders from the server once the URL settles.
 */
export function useDebouncedSearchParam(param = "q", delay = 350) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fromUrl = searchParams.get(param) ?? "";
  const [value, setValue] = useState(fromUrl);
  const [lastFromUrl, setLastFromUrl] = useState(fromUrl);

  // The URL is the source of truth (back/forward, a cleared filter chip).
  if (fromUrl !== lastFromUrl) {
    setLastFromUrl(fromUrl);
    setValue(fromUrl);
  }

  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.trim()) params.set(param, next.trim());
      else params.delete(param);
      params.delete("page");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }, delay);
  }

  return { value, onChange, isPending };
}
