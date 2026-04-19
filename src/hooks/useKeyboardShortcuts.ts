import { useEffect } from "react";

interface Handlers {
  onOpen?: () => void;
  onConvert?: () => void;
  onClear?: () => void;
  onHelp?: () => void;
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

export function useKeyboardShortcuts({ onOpen, onConvert, onClear, onHelp }: Handlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;

      const meta = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (meta && key === "o") {
        e.preventDefault();
        onOpen?.();
        return;
      }

      if (meta && (key === "enter" || key === "return")) {
        e.preventDefault();
        onConvert?.();
        return;
      }

      if (key === "escape") {
        onClear?.();
        return;
      }

      if (e.key === "?" || (e.shiftKey && key === "/")) {
        e.preventDefault();
        onHelp?.();
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpen, onConvert, onClear, onHelp]);
}
