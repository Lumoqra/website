---
trigger: always_on
description: "Design knowledge base for website work: hierarchy, UX laws, color (OKLCH, contrast, dark mode), typography, spacing, layout patterns, component states, visual effects and motion. Apply to every UI change."
---

# UI/UX MASTER PROTOCOL (2 of 3): Design System Knowledge

**Priority of sources:** (1) the project's existing design system, brand guide and tokens always win; (2) references the user supplies (brand colors, screenshots, links); (3) the defaults in this file, used only to fill gaps or when building from scratch.

## 1. Visual hierarchy and composition

- Every view has one clear focal point and **one primary action**. Make the primary CTA the single element that looks different (Von Restorff effect).
- Build hierarchy with **weight and color first, size second**. De-emphasize secondary and tertiary information (lighter color, smaller, regular weight) instead of only enlarging the important thing.
- Squint test: blur your eyes at a screenshot. The primary heading and primary action must still be obvious.
- Proximity: space **inside** a group < space **between** groups < space **between sections**. Related items sit close; unrelated items separate clearly.
- Align to a consistent grid and shared left edges. Center only short text (≤ 2–3 lines). Left-align body copy.
- Start with generous whitespace, then reduce. Cramped layouts look cheap; space looks premium.
- Label/value pairs: de-emphasize the label (small, muted), emphasize the value.
- Button hierarchy: **primary** = solid accent fill; **secondary** = outline or tonal; **tertiary** = text style. Destructive actions are not automatically big and red; make them red and solid only in the confirmation step.
- Design in grayscale first; add color last, with purpose.
- Consistency: the same component looks and behaves the same everywhere on the site.

### UX laws to apply
- **Jakob's law:** use conventions users already know (logo top-left linking home, nav at top, search and cart top-right, footer with legal and contact links).
- **Hick's law:** fewer, clearer choices. Keep top-level navigation to about 5–7 items; group the rest.
- **Fitts's law:** primary actions are large and close to where the user's attention or thumb already is.
- **Miller's law / cognitive load:** chunk information into small groups; progressive disclosure for detail.
- **Doherty threshold:** respond to every interaction within ~400 ms; show loading or progress feedback when work takes longer.
- **Aesthetic-usability effect:** polish raises perceived usability, but never at the cost of function.
- **Nielsen's 10 heuristics:** visibility of system status; match with the real world; user control and freedom (undo, cancel, back); consistency and standards; error prevention; recognition over recall; flexibility and efficiency; aesthetic and minimalist design; help users recognize, diagnose and recover from errors; help and documentation.

## 2. Color

### Principles
- **60-30-10:** about 60% dominant neutral (backgrounds), 30% secondary (surfaces, structure, headings), 10% accent (CTAs, links, key highlights). The accent signals action; do not spend it on decoration.
- **Work in OKLCH** (`oklch(L C H)`). Its lightness is perceptual, so equal L steps look equal across hues, ramps and hover states are predictable, and it can express P3 wide-gamut colors. HSL lightness is not perceptual (yellow and blue at the same HSL L look very different).
- **Ramps:** 10–12 steps per hue. Step L evenly; lower chroma near the very light and very dark ends so colors stay in gamut.
- **Step roles** (12-step model): 1–2 app and subtle backgrounds · 3–5 component backgrounds (normal / hover / pressed-selected) · 6–8 borders (subtle / UI element / strong and focus) · 9–10 solid fills such as buttons (normal / hover) · 11 low-contrast text · 12 high-contrast text.
- **Two token layers:** primitive palette (`--blue-9`) → semantic tokens (`--color-accent`, `--color-text`, `--color-surface`, `--color-border`, `--color-danger`). Components use semantic tokens only.
- **Neutrals:** tint grays slightly toward the brand hue (chroma ~0.005–0.02) so they feel intentional. Prefer near-black text (L ≈ 0.2) over `#000` for long reading.
- **Status colors:** success (green), warning (amber, with dark text on it), danger (red), info (blue). Always pair color with an icon or text; never rely on color alone (WCAG 1.4.1).
- **Harmony** (rotate hue in OKLCH while keeping L and C): monochromatic; analogous (±30°); complementary (180°) for a contrasting accent; split-complementary; triadic. Brand colors override theory.
- **Color meaning** (use with brand context): blue = trust, calm; green = success, growth; red = urgency, error; orange/yellow = energy, caution; purple = premium, creative; black/gold = luxury.
- **States:** derive hover/active from the base token instead of inventing colors:
  `color-mix(in oklch, var(--color-accent), black 12%)` or relative color `oklch(from var(--color-accent) calc(l - 0.06) c h)`.
- **Gradients:** interpolate in OKLCH (`linear-gradient(in oklch, …)`) to avoid muddy grey middles. Keep them subtle; text on a gradient must pass contrast at its worst point.
- **Transparency:** use alpha tokens for overlays, scrims and borders that sit on varied backgrounds.

### Contrast (WCAG 2.2 AA; compute it, never eyeball it)
- Normal text ≥ **4.5:1**. Large text (≥ 24 px regular or ≥ ~18.66 px bold) ≥ **3:1**.
- UI components, input borders, icons that convey meaning, chart elements and focus indicators ≥ **3:1** against adjacent colors.
- Check every state: default, hover, focus, active, visited, selected, error. Placeholder and helper text that carries information also need 4.5:1.
- Text over images or video: add a scrim or overlay so the worst frame still passes.
- AAA (7:1) is a bonus for long-form reading, not a requirement.

### Dark mode
- Not an inversion; it is a separate, tuned palette.
- Background: dark gray, not pure black (Material Design recommends `#121212` as the base dark surface). Text: off-white, not pure `#fff`, for long reading.
- Elevation: lighter surfaces mean higher elevation; shadows barely read on dark backgrounds, so use surface lightness and subtle borders.
- Desaturate and lighten accents so they do not vibrate against dark surfaces. Re-check every contrast pair.
- Declare `color-scheme: light dark`. Respect `prefers-color-scheme` and any existing theme toggle; persist the user's choice; set the theme before first paint to avoid a flash.
- Implement with the project's existing method (`[data-theme]`, `.dark` class, or `light-dark()`); do not add a second mechanism.

### Default token starter (only when the project has no system)
All pairs below were checked: light text/bg 16.8:1, muted/bg 6.4:1, on-accent/accent 5.6:1, accent/bg 5.6:1, strong border/bg 3.5:1; dark text/bg 15.8:1, muted/bg 8.2:1, on-accent/accent 7.5:1, strong border/bg 3.9:1.
```css
:root {
  color-scheme: light dark;
  --color-bg:            light-dark(oklch(0.99 0.003 260), oklch(0.18 0.010 260));
  --color-surface:       light-dark(oklch(1 0 0),          oklch(0.21 0.012 260));
  --color-surface-2:     light-dark(oklch(0.965 0.005 260), oklch(0.25 0.014 260));
  --color-border:        light-dark(oklch(0.90 0.008 260), oklch(0.32 0.014 260));
  --color-border-strong: light-dark(oklch(0.62 0.012 260), oklch(0.55 0.014 260));
  --color-text:          light-dark(oklch(0.22 0.015 260), oklch(0.94 0.006 260));
  --color-text-muted:    light-dark(oklch(0.48 0.015 260), oklch(0.74 0.012 260));
  --color-accent:        light-dark(oklch(0.52 0.19 262),  oklch(0.72 0.14 262));
  --color-accent-hover:  light-dark(oklch(0.46 0.19 262),  oklch(0.78 0.105 262));
  --color-on-accent:     light-dark(oklch(0.99 0.003 260), oklch(0.18 0.010 260));
  --color-focus:         var(--color-accent);
}
```

## 3. Typography

- **Families:** at most two (one display + one text) or one variable family. Pair by contrast in structure (serif display + sans text, or geometric + humanist) with similar x-heights. Always include a system fallback stack.
- **Body size:** never below 1rem (16 px); 1.0625–1.125rem is comfortable on desktop. Inputs ≥ 16 px (prevents iOS zoom on focus).
- **Line-height (unitless):** body 1.5–1.7; headings 1.05–1.25; UI labels about 1.2–1.4. Longer lines need more line-height.
- **Measure:** 45–75 characters per line (about 66 ideal). Use `max-inline-size: 65ch` on text blocks.
- **Scale:** modular ratio ~1.2 on mobile growing to ~1.25 on desktop, fluid with `clamp()`. The preferred value must mix rem and vw (never pure vw) so text still scales with zoom; test at 200% zoom.
- **Weights:** 400 body; 500–600 UI and emphasis; 700 headings. Use 2–3 weights maximum. Do not set UI text below 400; de-emphasize with color or size instead.
- **Letter-spacing:** tighten large headings slightly (−0.01 to −0.03em); open small uppercase labels (+0.04 to +0.08em). Never letter-space lowercase body text.
- **Wrapping:** `text-wrap: balance` on headings and short centered text; `text-wrap: pretty` on paragraphs (enhancement; harmless where unsupported).
- **Numbers:** `font-variant-numeric: tabular-nums` for prices, tables, counters and timers.
- **Links in body text:** underlined, or otherwise distinguishable by more than color. Use `text-underline-offset: 0.15em` and a deliberate `text-decoration-thickness`.
- No justified text on the web (rivers) unless hyphenation is on and tested. Avoid all-caps for anything longer than a short label.
- **Font loading:** self-host WOFF2; `font-display: swap` (or `optional` for non-critical fonts); preload only the 1–2 fonts used above the fold; subset; use fallback metric overrides (`size-adjust`, `ascent-override`) to limit layout shift.

Default fluid scale (320 → 1240 px viewport, 16 → 18 px base, ratio 1.2 → 1.25):
```css
:root {
  --step--1: clamp(0.833rem, 0.810rem + 0.116vw, 0.900rem);
  --step-0:  clamp(1rem,     0.957rem + 0.217vw, 1.125rem);
  --step-1:  clamp(1.2rem,   1.128rem + 0.359vw, 1.406rem);
  --step-2:  clamp(1.44rem,  1.329rem + 0.553vw, 1.758rem);
  --step-3:  clamp(1.728rem, 1.565rem + 0.816vw, 2.197rem);
  --step-4:  clamp(2.074rem, 1.840rem + 1.170vw, 2.747rem);
  --step-5:  clamp(2.488rem, 2.160rem + 1.643vw, 3.433rem);
}
```

## 4. Spacing and sizing

- 4 px base, 8 px rhythm, expressed in rem: `--space-3xs: 0.25rem; --space-2xs: 0.5rem; --space-xs: 0.75rem; --space-s: 1rem; --space-m: 1.5rem; --space-l: 2rem; --space-xl: 3rem; --space-2xl: 4rem; --space-3xl: 6rem;`
- Section padding can be fluid: e.g. `padding-block: clamp(3rem, 2rem + 5vw, 7.5rem)`.
- **Units:** font sizes in rem; padding inside text-sized components (buttons, badges, pills) in **em** so it scales with the component's font size; page and layout spacing in rem; hairline borders in px; line-height unitless.
- **Targets:** interactive elements at least **44×44 CSS px** where possible; never below 24×24 (WCAG 2.2 AA 2.5.8) without enough spacing around them.
- **Radii:** one scale (e.g. 4 / 8 / 12 / 16 px / full). Nested corners: inner radius = outer radius − padding.

## 5. Layout patterns

- **Mobile-first, content-driven breakpoints:** add a breakpoint where the content breaks, not at device widths. Reuse the project's breakpoints. Prefer intrinsic layouts that need no breakpoints at all.
- Flexbox for one-dimensional flows, Grid for two-dimensional layouts. Space items with `gap`, not margins.
- Auto-responsive grid: `grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));`
- Container queries for components that appear in slots of different widths.
- No fixed heights on anything containing text; use `min-block-size`. For full-screen heroes use `min-block-size: 100svh` (or `dvh`), not `100vh`.
- Media: fixed `aspect-ratio` + `object-fit: cover`; set `object-position` to keep faces in frame.
- Overlays and stacked content: grid stacking (`grid-area: 1 / 1`) rather than absolute positioning.
- Sticky headers: set `scroll-padding-top` so anchor targets and focused elements are not hidden under the header (WCAG 2.4.11).
- Visual order must match DOM order so keyboard and screen-reader order make sense.
- Section patterns:
  - **Hero:** one H1, a supporting sentence, one primary CTA (optional secondary), a supporting visual, and a trust signal.
  - **Features:** 3–4 items in a grid with icon, short title and one or two lines.
  - **Social proof:** real logos or testimonials only, never invented.
  - **Pricing:** highlight one recommended plan, align rows, use tabular numbers.
  - **FAQ:** `<details>/<summary>`.
  - **CTA band:** one action.
  - **Footer:** grouped links, contact, legal.
- Separate sections with a subtle background change (bg ↔ surface) rather than heavy rules.

## 6. Components and states

Every interactive component defines: default · hover (pointer devices only: `@media (hover: hover)`) · `:focus-visible` · active/pressed · disabled · loading · selected/current · error · success · empty.

- **Buttons:** min-height ~2.75rem; padding ~`0.75em 1.25em`; verb-first labels ("Start free trial"); icon–text gap ~0.5em; the loading state keeps the button's width (no jump); disabled must still be recognizable, and explain why it is disabled when possible.
- **Links vs. buttons:** a link navigates; a button performs an action.
- **Forms:** visible labels (a placeholder is not a label); helper text before input; inline errors linked with `aria-describedby`, shown with text + icon; correct `type`, `inputmode` and `autocomplete`; group with `fieldset`/`legend`; state requirements up front; do not disable submit as a validation method; preserve entered data on error.
- **Cards:** consistent padding and media ratio; make the whole card clickable via a stretched link on the heading link, not by wrapping block content in multiple links.
- **Navigation:** indicate the current page with `aria-current="page"`; mobile menu toggle uses `aria-expanded` and `aria-controls`; include a skip link.
- **Modals:** native `<dialog>` with `showModal()`; focus moves in and returns on close; Esc closes; `overscroll-behavior: contain`. Never open a modal on page load unless asked.
- **Tooltips, menus, dropdowns:** `popover` attribute; anchor positioning with a fallback. Hover/focus content must be dismissible, hoverable and persistent (WCAG 1.4.13).
- **Accordions:** `<details>/<summary>`.
- **Toasts and status messages:** `aria-live="polite"` region; errors do not auto-dismiss.
- **Loading:** skeletons that match the final layout (prevents layout shift); spinners only for short waits.
- **Empty states:** explain what goes here and offer the next action.
- **Icons:** inline SVG with `currentColor`, one consistent stroke style and size scale; decorative icons get `aria-hidden="true"`; icon-only buttons need an accessible name.

## 7. Visual effects (restraint is the professional default)

- **Shadows:** an elevation scale (sm / md / lg) of layered, soft shadows tinted toward the background hue at low alpha, with light from above (y offset, x = 0). In dark mode, rely on lighter surfaces and subtle borders instead.
- **Separation:** use one of border, shadow or background change, not all three at once.
- **Radius** expresses personality: small = technical and serious; large = friendly. Keep it consistent.
- **Gradients, glows, mesh backgrounds:** subtle, in OKLCH, at most one hero-level effect per viewport.
- **Glass / `backdrop-filter`:** only with a solid-color fallback in `@supports`; ensure text contrast against the worst-case backdrop; avoid on large scrolling areas (performance).
- **Hover effects:** small `translate` (−2 px) and/or shadow change. Never change width, padding, border-width or font-weight on hover (causes layout shift).
- **Images:** consistent aspect ratios and corner radius within a set.
- Do not: use text-shadow to rescue readability (use a scrim), add neon glows everywhere, or stack several attention-grabbing effects in one viewport.

## 8. Motion

- Motion exists for feedback, orientation and continuity, never decoration alone.
- **Durations:** 100–150 ms micro-interactions (hover, press, toggle); 150–250 ms small elements (tooltip, dropdown, fade); 250–400 ms panels, modals, page transitions. UI feedback should never exceed ~500 ms.
- **Easing:** ease-out for entering (e.g. `cubic-bezier(0.16, 1, 0.3, 1)`); ease-in for exiting; ease-in-out for on-screen moves; linear only for spinners and progress.
- **Animate only `transform` and `opacity`** (and `filter` sparingly). Never animate width, height, top, left or margin.
- Stagger list items by 30–60 ms and cap the total.
- **Entry/exit** of `display: none` and top-layer elements: `@starting-style` + `transition-behavior: allow-discrete`.
- **Scroll reveals:** CSS scroll-driven animations inside `@supports (animation-timeline: view())` and `@media (prefers-reduced-motion: no-preference)`. Content must be fully visible when the animation does not run; never ship `opacity: 0` as the default state.
- **View transitions:** progressive enhancement only.
- **Reduced motion:** replace movement with a simple fade or no animation, but keep functional feedback (spinners, progress bars). Do not use a global `0.01ms !important` kill switch that also breaks loaders.
- Anything that moves, blinks or auto-scrolls for more than 5 seconds needs a pause or stop control (WCAG 2.2.2). Nothing may flash more than 3 times per second.
- Tokens: `--dur-fast: 120ms; --dur-base: 200ms; --dur-slow: 320ms; --ease-out: cubic-bezier(0.16, 1, 0.3, 1); --ease-in: cubic-bezier(0.7, 0, 0.84, 0); --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);`
