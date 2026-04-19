interface Props {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

const TICKS = [
  { v: 20, label: "Low" },
  { v: 50, label: "Med" },
  { v: 80, label: "High" },
  { v: 100, label: "Max" },
];

export function QualitySlider({ value, onChange, disabled }: Props) {
  return (
    <div className="quality-slider" data-disabled={disabled || undefined}>
      <div className="quality-slider-head">
        <span className="quality-slider-label">Quality</span>
        <span className="quality-slider-value">{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        aria-label="Output quality"
      />
      <div className="quality-slider-ticks">
        {TICKS.map((t) => (
          <button
            key={t.v}
            type="button"
            className="quality-slider-tick"
            data-active={Math.abs(t.v - value) <= 4 || undefined}
            onClick={() => onChange(t.v)}
            disabled={disabled}
            aria-label={`Set quality to ${t.label}`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
