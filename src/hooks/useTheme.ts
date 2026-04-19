import { useCallback, useEffect, useState } from "react";

export type ThemePref = "light" | "dark" | "auto";
type Resolved = "light" | "dark";

const STORAGE_KEY = "easyconvert.theme";

function readStored(): ThemePref {
  if (typeof window === "undefined") return "auto";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" || v === "auto" ? v : "auto";
}

function applyTheme(resolved: Resolved) {
  document.documentElement.dataset.theme = resolved;
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(readStored);
  const [systemDark, setSystemDark] = useState<boolean>(() =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolved: Resolved = pref === "auto" ? (systemDark ? "dark" : "light") : pref;

  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  const setTheme = useCallback((next: ThemePref) => {
    setPref(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const cycle = useCallback(() => {
    setPref((p) => {
      const next: ThemePref = p === "light" ? "dark" : p === "dark" ? "auto" : "light";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { pref, resolved, setTheme, cycle };
}
