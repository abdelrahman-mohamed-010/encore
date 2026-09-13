"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Fatal application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100dvh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          padding: "1.25rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#faf9f7",
          color: "#1a1a1f",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>That did not work</h1>
        <p style={{ margin: 0, maxWidth: "28rem", lineHeight: 1.6, opacity: 0.7 }}>
          Encore hit an unexpected error and could not recover. Reloading often clears it.
        </p>
        {error.digest && (
          <p style={{ margin: 0, fontFamily: "monospace", fontSize: "0.75rem", opacity: 0.5 }}>
            Reference: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: "0.75rem",
            borderRadius: "0.625rem",
            border: 0,
            background: "#1a1a1f",
            color: "#fff",
            padding: "0.7rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
