import { useTheme } from "../hooks/useTheme";

const LABEL: Record<string, string> = {
  light: "Light",
  dark: "Dark",
  auto: "Auto",
};

const GLYPH: Record<string, string> = {
  light: "○",
  dark: "●",
  auto: "◐",
};

export function ThemeToggle() {
  const { pref, resolved, cycle } = useTheme();
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={cycle}
      aria-label={`Theme: ${LABEL[pref]} (${resolved})`}
      title={`Theme: ${LABEL[pref]} — click to cycle`}
    >
      <span className="theme-toggle-glyph" aria-hidden="true">
        {GLYPH[pref]}
      </span>
      <span className="theme-toggle-label">{LABEL[pref]}</span>
    </button>
  );
}
