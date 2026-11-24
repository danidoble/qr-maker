import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";
const KEY = "qr-maker-theme";

function current(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(current);

  // Follow the OS until the user picks explicitly.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      if (localStorage.getItem(KEY)) return;
      const t: Theme = mq.matches ? "light" : "dark";
      document.documentElement.dataset.theme = t;
      setTheme(t);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = current() === "dark" ? "light" : "dark";
    const apply = () => {
      document.documentElement.dataset.theme = next;
      setTheme(next);
    };
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
    // Smooth cross-fade where the View Transitions API exists.
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => unknown;
    };
    if (
      doc.startViewTransition &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      doc.startViewTransition(apply);
    else apply();
  }, []);

  return { theme, toggle };
}
