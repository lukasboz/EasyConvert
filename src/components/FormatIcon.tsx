import type { Format } from "../types/conversion";

type Category = Format["type"];

interface Props {
  category: Category;
  size?: number;
  className?: string;
}

export function FormatIcon({ category, size = 12, className }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 12 12",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: ["format-icon", className].filter(Boolean).join(" "),
    "aria-hidden": true,
  };

  switch (category) {
    case "Image":
      return (
        <svg {...common}>
          <rect x="1.5" y="1.5" width="9" height="9" />
          <line x1="1.5" y1="10.5" x2="10.5" y2="1.5" />
        </svg>
      );
    case "Video":
      return (
        <svg {...common}>
          <polygon points="3,2 10,6 3,10" />
        </svg>
      );
    case "Audio":
      return (
        <svg {...common}>
          <line x1="1.5" y1="6" x2="10.5" y2="6" />
          <line x1="3" y1="3.5" x2="9" y2="3.5" />
          <line x1="4.5" y1="8.5" x2="7.5" y2="8.5" />
        </svg>
      );
    case "Document":
      return (
        <svg {...common}>
          <path d="M2.5 1.5 H7.5 L9.5 3.5 V10.5 H2.5 Z" />
          <polyline points="7.5,1.5 7.5,3.5 9.5,3.5" />
        </svg>
      );
    case "Archive":
      return (
        <svg {...common}>
          <line x1="6" y1="1.5" x2="6" y2="10.5" />
          <line x1="4.5" y1="2.5" x2="7.5" y2="2.5" />
          <line x1="4.5" y1="4.5" x2="7.5" y2="4.5" />
          <line x1="4.5" y1="6.5" x2="7.5" y2="6.5" />
          <line x1="4.5" y1="8.5" x2="7.5" y2="8.5" />
        </svg>
      );
  }
}
