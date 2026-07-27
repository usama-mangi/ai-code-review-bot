# Design System

<!-- impeccable:design-schema 1 -->

## Visual World

**Instrument panel / cockpit display.** The dashboard reads as an operational command surface — dense, glanceable, status-driven. Every element earns its space through information, not decoration. The aesthetic comes from cockpit instruments, oscilloscopes, and monitoring terminals: constrained containers, high-contrast status signals, monospace data labels, and a dark base that lets colored status cut through.

## Color System

**Strategy:** Restrained — near-black base with one saturated accent, status colors as functional signals.

| Token | Value | Role |
|---|---|---|
| `--bg-primary` | `#0c0c10` | Page background |
| `--bg-secondary` | `#131318` | Sidebar, raised surfaces |
| `--bg-card` | `#18181f` | Panel backgrounds |
| `--bg-card-hover` | `#1e1e27` | Hover state |
| `--bg-elevated` | `#22222c` | Tooltips, dropdowns |
| `--border` | `#2a2a36` | Panel borders, dividers |
| `--border-subtle` | `#1f1f2a` | Inner dividers, subtle separation |
| `--text-primary` | `#e8e8ef` | Headings, primary content |
| `--text-secondary` | `#a0a0b4` | Body text, descriptions |
| `--text-muted` | `#6a6a82` | Labels, metadata, timestamps |
| `--accent` | `#e5a530` | Primary action, active nav, brand |
| `--accent-dim` | `rgba(229,165,48,0.12)` | Accent backgrounds, active states |
| `--accent-glow` | `rgba(229,165,48,0.08)` | Subtle glow effects |
| `--status-ok` | `#34d399` | Success, enabled, healthy |
| `--status-warn` | `#fbbf24` | Warning, pending, attention |
| `--status-critical` | `#f87171` | Error, bug, failed |
| `--status-info` | `#60a5fa` | Info, style, processing |

**Severity badges** use `12% opacity` backgrounds with the status color as text — not solid fills. This keeps the dense layout readable without color bleeding.

## Typography

**Primary:** IBM Plex Sans — clean, technical, neutral personality. Used for all UI text.
**Monospace:** IBM Plex Mono — data labels, code references, timestamps, file paths. Used via `.code-font` class.

| Role | Size | Weight | Tracking | Usage |
|---|---|---|---|---|
| Page title | 18px (`text-lg`) | 700 | normal | H1 headings |
| Section header | 12px (`text-xs`) | 700 | 0.1em uppercase | Panel headers, labels |
| Body | 13px (base) | 400 | 0.01em | Descriptions, content |
| Metadata | 10-11px | 600 | 0.1em uppercase | Stat labels, timestamps |
| Code/data | 12px (`.code-font`) | 400 | normal | File paths, commit SHAs |

**Base size:** 13px — slightly smaller than convention to increase information density.

## Spacing

Tight grouping, generous separation. The layout uses 4-5px padding inside panels, 12-20px gaps between elements, and 20px (p-5) page padding. More space above headings than below.

| Context | Value |
|---|---|
| Page padding | 20px (`p-5`) |
| Panel internal padding | 12-16px (`p-3` to `p-4`) |
| Between panels | 12px (`gap-3`) |
| Between related items | 4-8px (`gap-1` to `gap-2`) |
| Panel border-radius | 8px (`rounded-lg`) |
| Button border-radius | 6px (`rounded-md`) |
| Badge border-radius | 4px (`rounded`) |

## Components

### Panel
The primary container. 1px border, 8px radius, `--bg-card` background. No shadow — depth comes from background color hierarchy (primary → secondary → card → elevated).

### Panel Header
Uppercase tracking-widest labels at 12px, separated from content by a 1px `--border-subtle` divider. Carries action links (e.g., "View All →") on the right.

### Badges
11px uppercase semibold, 4px radius, 12% opacity background in the status color. No borders. Compact — padding is 2px vertical, 6px horizontal.

### Stat Cards
Panel with stat-label (10-11px uppercase muted) above stat-value (24px IBM Plex Mono bold, tabular-nums). Minimal — no icon decoration, no delta arrows.

### Buttons
**Primary:** `--accent` background, `--bg-primary` text, 6px radius, 14px/32px padding. Scale on active (0.97).
**Ghost:** Transparent, `--text-secondary` color, `--bg-card` on hover.

### Nav Items
24px padding, 12px text, no borders. Active state: `--accent-dim` background, `--accent` text. No indicators or badges.

### Toggle Switch
20px × 36px, `--accent` when enabled, `--border` when disabled. 16px white knob with translate-x transition.

## Responsive

| Breakpoint | Behavior |
|---|---|
| < `lg` | Sidebar hidden, mobile header with hamburger, single column |
| ≥ `lg` | Sidebar visible, 224px fixed, main content fills remaining |
| ≥ `xl` | Dashboard charts use 3-column grid, review detail uses 4-column grid |

## Motion

Minimal. `prefers-reduced-motion` disables all animations. Active animations:
- `fadeIn`: 250ms ease-out, opacity 0→1
- `slideUp`: 300ms ease-out, opacity 0→1 + translateY 8px→0
- `pulse`: 2s infinite for processing badges and skeletons

## Accessibility

- All interactive elements have `focus-visible` outlines (2px `--accent`)
- `aria-label` on icon-only buttons (logout, search clear, play/pause)
- `role="switch"` + `aria-checked` on repository toggles
- `role="navigation"` + `aria-label="Main navigation"` on sidebar nav
- Reduced motion media query disables all animations
- Color contrast: `--text-muted` (#6a6a82) on `--bg-primary` (#0c0c10) ≈ 4.9:1
