// Small line icons drawn with currentColor, so CSS can colour them (emoji can't be recoloured, and phones
// draw characters like ⏸ as coloured emoji). CSS can also resize them by setting the svg's width/height.

const svgProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

const filledProps = { ...svgProps, fill: "currentColor", stroke: "none" };

export function ShuffleIcon() {
  return (
    <svg {...svgProps}>
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  );
}

export function LoopIcon() {
  return (
    <svg {...svgProps}>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg {...filledProps}>
      <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" />
    </svg>
  );
}

export function PauseIcon() {
  return (
    <svg {...filledProps}>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

export function PreviousIcon() {
  return (
    <svg {...filledProps}>
      <rect x="4" y="5" width="2.5" height="14" rx="1" />
      <path d="M20 5.9v12.2a1 1 0 0 1-1.55.83L9.3 12.83a1 1 0 0 1 0-1.66l9.15-6.1A1 1 0 0 1 20 5.9z" />
    </svg>
  );
}

export function NextIcon() {
  return (
    <svg {...filledProps}>
      <path d="M4 5.9v12.2a1 1 0 0 0 1.55.83l9.15-6.1a1 1 0 0 0 0-1.66L5.55 5.07A1 1 0 0 0 4 5.9z" />
      <rect x="17.5" y="5" width="2.5" height="14" rx="1" />
    </svg>
  );
}

export function LibraryIcon() {
  return (
    <svg {...svgProps}>
      <line x1="5" y1="4" x2="5" y2="20" />
      <line x1="10" y1="4" x2="10" y2="20" />
      <path d="M14.5 4.5l5 15" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg {...svgProps}>
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  );
}

export function PlaylistsIcon() {
  return (
    <svg {...svgProps}>
      <line x1="3" y1="6" x2="15" y2="6" />
      <line x1="3" y1="12" x2="12" y2="12" />
      <line x1="3" y1="18" x2="10" y2="18" />
      <circle cx="16.5" cy="18" r="2.5" />
      <path d="M19 18V8h2.5" />
    </svg>
  );
}

export function QueueIcon() {
  return (
    <svg {...svgProps}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="12" y2="18" />
      <path d="M16 15.5v5l4-2.5z" fill="currentColor" />
    </svg>
  );
}

export function ChevronDownIcon() {
  return (
    <svg {...svgProps}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function MoreIcon() {
  return (
    <svg {...filledProps}>
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}
