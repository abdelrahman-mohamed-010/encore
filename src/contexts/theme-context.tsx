"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "encore-theme";
const THEME_EVENT = "encore:theme";

/* ---------------------------------------------------------------------------
 * Theme is external state (localStorage + the OS preference), so it is read
 * through useSyncExternalStore rather than mirrored into React state inside an
 * effect. That keeps the first client render consistent with what the inline
 * head script already painted.
 * ------------------------------------------------------------------------- */

function subscribeToStoredTheme(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  } catch {
    return "system";
  }
}

function subscribeToSystemTheme(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function readSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const ThemeContext = React.createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolved: "light" | "dark";
}>({ theme: "system", setTheme: () => {}, resolved: "light" });

export const useTheme = () => React.useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = React.useSyncExternalStore(
    subscribeToStoredTheme,
    readStoredTheme,
    () => "system" as Theme,
  );

  const systemTheme = React.useSyncExternalStore(
    subscribeToSystemTheme,
    readSystemTheme,
    () => "light" as const,
  );

  const resolved = theme === "system" ? systemTheme : theme;

  // Pushing the result onto <html> is a genuine external-system sync.
  React.useEffect(() => {
    // An attribute rather than a class: it is the same switch the design kit
    // uses, and it reads unambiguously in devtools next to app classes.
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  }, [resolved]);

  const setTheme = React.useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode or blocked storage: the choice just will not persist.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  const value = React.useMemo(() => ({ theme, setTheme, resolved }), [theme, setTheme, resolved]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Runs before hydration so there is never a flash of the wrong theme. */
export const themeScript = `
(function(){try{
  var t = localStorage.getItem('${STORAGE_KEY}') || 'system';
  var d = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = d ? 'dark' : 'light';
  document.documentElement.style.colorScheme = d ? 'dark' : 'light';
}catch(e){}})();
`;
