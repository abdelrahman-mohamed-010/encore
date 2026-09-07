"use client";

import { useState } from "react";
import { toast } from "sonner";

/**
 * The reference's "COPY" affordance on the preview's address bar. Confirms
 * inline for two seconds rather than only through a toast, so the feedback
 * lands where the eye already is.
 */
export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard access can be denied outright (permissions, insecure
          // origin). Say so rather than showing a success that did not happen.
          toast.error("Could not copy the link", { description: value });
        }
      }}
      className="shrink-0 rounded px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide transition-colors hover:bg-white/15"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
