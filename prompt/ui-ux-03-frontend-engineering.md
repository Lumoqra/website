---
trigger: always_on
description: "Front-end engineering standards for website work: semantic HTML, CSS architecture and units, framework rules, WCAG 2.2 AA checklist, images/video/embeds, Core Web Vitals, responsive QA matrix, browser-support policy and banned anti-patterns."
---

# UI/UX MASTER PROTOCOL (3 of 3): Front-End Engineering Standards

## 1. Semantic HTML

- `<!doctype html>`, `<html lang="…">`, `<meta charset="utf-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`. Never add `user-scalable=no` or `maximum-scale=1`.
- Landmarks: `header`, `nav` (add `aria-label` when there is more than one), a single `main`, `footer`, `aside`; give every `section` a heading.
- One `h1` per page; heading levels in order, never chosen for their looks (style with classes).
- `<a href>` navigates; `<button type="button">` acts. Never put click handlers on `div` or `span`.
- Lists for lists; `<table>` with `<caption>`, `<th scope>` for tabular data only.
- Meaningful `alt` on informative images; `alt=""` on decorative ones.
- Forms: `<label for>` on every control, `fieldset`/`legend` for groups, `autocomplete` tokens.
- A skip link ("Skip to main content") as the first focusable element.
- Prefer native elements (`dialog`, `details`, `popover`, `input type`) over ARIA. Add ARIA only to fill a real gap; wrong ARIA is worse than none.

## 2. CSS architecture and code standards

### Follow the project
Reuse its methodology (BEM, utilities, CSS Modules, CSS-in-JS, Tailwind), file locations, naming, property order and formatting. Put new rules next to the related existing rules.

### Rules for new CSS
- **Tokens:** design values live in custom properties on `:root`; component variants set local custom properties (`.button { --_bg: var(--color-accent); background: var(--_bg); }`).
- **Low specificity:** single class selectors; no IDs for styling; nesting depth ≤ 3; use `:where()` for zero-specificity base styles. No `!important` except in utility classes meant to win or to beat third-party inline styles.
- **Cascade layers caution:** unlayered styles beat every layered style. In an existing unlayered codebase, do **not** wrap new rules in `@layer` (they would lose) and do not move existing CSS into layers. Use `@layer reset, base, layout, components, utilities;` only in new projects or where the project already uses layers.
- **Units:** `font-size` in rem (never px); component padding in em; layout widths in rem, ch, % or `min()`; borders in px; line-height unitless; media queries in em (or the project's unit).
- **Logical properties** in new rules (`margin-inline`, `padding-block`, `inline-size`, `max-inline-size`, `inset`). Do not convert existing rules you were not asked to touch.
- **Don't declare what you don't need:** no `width: 100%` on block elements, no heights on text containers, no `vw` widths on content (they ignore the scrollbar and overflow), no breakpoints where an intrinsic layout works.
- Prefer `min()`, `max()`, `clamp()`, `aspect-ratio`, `gap` and Grid/Flex over magic numbers and positioning hacks.
- Hover-only effects inside `@media (hover: hover) and (pointer: fine)`.
- Comment only non-obvious decisions, briefly.

### Snippet library (use when it fits the project; adapt names to its convention)
```css
/* Starter for new projects only (never paste over an existing reset) */
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; line-height: 1.5; }
h1, h2, h3, h4 { line-height: 1.1; text-wrap: balance; }
p { text-wrap: pretty; }
img, picture, video, svg { display: block; max-inline-size: 100%; }
input, button, textarea, select { font: inherit; }
:target { scroll-margin-block: 5ex; }

/* Vertical rhythm between siblings */
.flow > * + * { margin-block-start: var(--flow-space, 1em); }

/* Simple wrapper */
.wrapper { inline-size: min(100% - 2rem, 70rem); margin-inline: auto; }

/* Content grid with breakout and full-bleed sections (no extra wrapper divs) */
.content-grid {
  --padding-inline: 1rem;
  --content-max: 70ch;
  --breakout-max: 85ch;
  --breakout-size: calc((var(--breakout-max) - var(--content-max)) / 2);
  display: grid;
  grid-template-columns:
    [full-width-start] minmax(var(--padding-inline), 1fr)
    [breakout-start] minmax(0, var(--breakout-size))
    [content-start] min(100% - var(--padding-inline) * 2, var(--content-max)) [content-end]
    minmax(0, var(--breakout-size)) [breakout-end]
    minmax(var(--padding-inline), 1fr) [full-width-end];
}
.content-grid > :not(.breakout, .full-width),
.full-width > :not(.breakout, .full-width) { grid-column: content; }
.content-grid > .breakout { grid-column: breakout; }
.content-grid > .full-width { grid-column: full-width; display: grid; grid-template-columns: inherit; }

/* Auto-responsive grid */
.auto-grid { display: grid; gap: var(--space-m, 1.5rem);
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--min, 18rem)), 1fr)); }

/* Accessible hiding */
.visually-hidden { clip-path: inset(50%); block-size: 1px; inline-size: 1px;
  overflow: hidden; position: absolute; white-space: nowrap; }

/* Focus */
:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
```

### Framework rules
- **Tailwind:** use theme tokens from the config (v3) or `@theme` (v4); extend the theme instead of arbitrary values like `p-[13px]`; keep the project's class order; use `@apply` only if the project already does; add `motion-safe:`/`motion-reduce:` and `focus-visible:` variants.
- **Bootstrap or other UI kits:** use their variables and utilities; override in the project's custom stylesheet loaded after the kit; never edit the kit's files.
- **React / Vue / Svelte / Astro:** keep component APIs (props, slots, events) backward compatible; add a variant prop instead of forking a component; follow the existing styling approach.
- **Framework image components** (Next.js, Nuxt, Astro): keep using them; set `sizes` and the framework's LCP-priority option on the hero image only.
- **WordPress:** child theme, block theme `theme.json`, or the existing custom CSS location. Never edit the parent theme, plugins or core.

## 3. Accessibility: WCAG 2.2 AA checklist

| SC | Requirement |
|---|---|
| 1.1.1 | Text alternatives for informative images, icons and controls |
| 1.3.1 | Structure conveyed in markup (headings, lists, labels, tables) |
| 1.4.1 | Color is not the only way information is conveyed |
| 1.4.3 / 1.4.11 | Contrast 4.5:1 text, 3:1 large text, 3:1 UI components, graphics and focus indicators |
| 1.4.4 / 1.4.10 | Text resizes to 200%; content reflows at 320 CSS px with no two-dimensional scrolling |
| 1.4.12 | Survives user text spacing (no fixed heights that clip) |
| 1.4.13 | Hover/focus content is dismissible, hoverable and persistent |
| 2.1.1 | Everything works with a keyboard; no keyboard traps |
| 2.2.2 | Auto-moving content longer than 5 s can be paused |
| 2.3.1 | Nothing flashes more than 3 times per second |
| 2.4.1 / 2.4.3 | Skip link; logical focus order |
| 2.4.4 | Link purpose clear from text (no bare "click here") |
| 2.4.7 / 2.4.11 | Focus is visible and not hidden by sticky headers, banners or cookie bars |
| 2.5.3 | Visible label text is included in the accessible name |
| 2.5.7 | Any drag action has a single-pointer alternative |
| 2.5.8 | Targets at least 24×24 CSS px (or enough spacing) |
| 3.1.1 | Page language set |
| 3.2.3 / 3.2.4 / 3.2.6 | Consistent navigation, identification and help location |
| 3.3.1–3.3.3 | Errors identified in text, labels/instructions present, fixes suggested |
| 3.3.7 / 3.3.8 | Don't ask for the same info twice; allow paste and password managers in logins |
| 4.1.2 / 4.1.3 | Correct name, role, value; status messages announced via live regions |

- Never `outline: none` without an equal or better replacement. Prefer `outline` over a box-shadow-only ring, because outlines survive Windows High Contrast (`forced-colors: active`).
- Keep borders on controls in forced-colors mode; do not convey state with background color alone.

## 4. Images, icons, video and embeds

### Images
- `<picture>` with AVIF/WebP plus a fallback; `srcset` + accurate `sizes`; always `width` and `height` attributes (or CSS `aspect-ratio`) to reserve space.
- **The LCP image** (usually the hero): never `loading="lazy"`; add `fetchpriority="high"` (one image per page); preload it if it is a CSS background.
- Below the fold: `loading="lazy"` and `decoding="async"`.
- Compress, never upscale, crop to the displayed ratio. Logos and icons as optimized SVG.
- Text on images: a gradient scrim so text passes 4.5:1 over the busiest area.

### Content video (the user is meant to watch it)
```html
<video controls playsinline preload="metadata" poster="poster.jpg" width="1280" height="720">
  <source src="video.webm" type="video/webm">
  <source src="video.mp4" type="video/mp4">
  <track kind="captions" src="captions.en.vtt" srclang="en" label="English" default>
</video>
```
- Never autoplay with sound. Provide captions (and a transcript link for long talks). Give it a responsive wrapper: `inline-size: 100%; block-size: auto; aspect-ratio: 16 / 9;`.

### Background / hero video (decorative)
```html
<video class="hero__video" autoplay muted loop playsinline preload="metadata"
       poster="hero-poster.jpg" aria-hidden="true">
  <source src="hero.webm" type="video/webm">
  <source src="hero.mp4" type="video/mp4">
</video>
<button class="hero__video-toggle" type="button">Pause background video</button>
```
- `muted` + `playsinline` are required for autoplay on iOS and most browsers. `poster` covers slow networks and failed loads.
- Provide a visible, keyboard-accessible pause/play button (looping motion > 5 s, WCAG 2.2.2). Swap its label between "Pause background video" and "Play background video" when toggled (do not also add `aria-pressed` to a button whose label changes).
- Under `prefers-reduced-motion: reduce`: do not autoplay; show the poster. Handle the `play()` promise rejection silently and fall back to the poster.
- Keep the file small: short seamless loop (6–15 s), ≤ 1080p, compressed to a few MB, no audio track.
- Cover the area with `object-fit: cover` in a container sized by `min-block-size` or `aspect-ratio`; add an overlay so text over it stays readable on every frame.
- Optional: pause when off-screen (IntersectionObserver) or when the tab is hidden; poster only when the user has data saver enabled.

### Third-party embeds (YouTube, Vimeo, maps)
- Above the fold: a normal `<iframe>` with a descriptive `title`. Below the fold: `loading="lazy"`, or better, a facade (e.g. lite-youtube-embed) that loads the player only on click.
- Responsive: `inline-size: 100%; block-size: auto; aspect-ratio: 16 / 9;`. Use `youtube-nocookie.com` when privacy matters.
- Verify playback in Chromium, Safari (iOS) and Firefox; check the console for autoplay or CSP errors and the network panel for 404s or wrong MIME types.

## 5. Performance (Core Web Vitals, 75th percentile of real users)

Targets: **LCP ≤ 2.5 s · INP ≤ 200 ms · CLS ≤ 0.1.**
- **CLS:** reserve space for every image, video, embed, ad and late-loading component; use font metric overrides; never insert content above content that is already visible; animate transforms, not layout.
- **LCP:** prioritize and never lazy-load the hero; trim render-blocking CSS/JS; preconnect only to critical origins; self-host fonts.
- **INP:** keep event handlers small; avoid layout thrashing (read then write); let CSS handle animation; defer non-critical scripts.
- Do not add libraries for things the platform already does: `<dialog>`, `popover`, `<details>`, anchor positioning, scroll-snap, smooth scrolling, container queries, view transitions.
- Long, below-the-fold sections may use `content-visibility: auto` with `contain-intrinsic-size`.

## 6. Responsive and cross-browser QA matrix

- **Widths:** 320, 375, 414, 768, 1024, 1280, 1440, 1920 px, plus phone landscape.
- **Engines:** Chromium, WebKit (Safari macOS/iOS), Gecko (Firefox).
- **Input:** mouse, touch, keyboard only.
- **User preferences:** dark mode, `prefers-reduced-motion`, `forced-colors`, 200% zoom, browser default font size raised to 20 px.
- **Content stress:** very long words and URLs (`overflow-wrap: anywhere` where needed), long names, +30% text length (translations), missing images, empty lists, error states.
- **Device details:** notches and safe areas (`env(safe-area-inset-*)`) if the site uses `viewport-fit=cover`; mobile browser toolbars (`svh`/`dvh`).
- Existing print styles must still work.

## 7. Browser-support policy (snapshot November 2026; verify on MDN or webstatus.dev when unsure)

Default target: **Baseline Widely available**. Use newer features only with a fallback that keeps the page fully usable.

- **Use freely:** Flexbox/Grid with `gap`, subgrid, custom properties, `clamp()/min()/max()`, `aspect-ratio`, logical properties, `:focus-visible`, `:is()/:where()`, `:has()`, CSS nesting, `@layer`, container size queries, `oklch()`/`oklab()`, `color-mix()`, `svh/dvh/lvh` units, `<dialog>`, `inert`, `text-wrap: balance`, `@media (prefers-*)`.
- **Newly available — fine with a fallback or where absence is harmless:** `popover`, `light-dark()`, relative color syntax, `@property`, `@starting-style`, `transition-behavior: allow-discrete`, `@scope`, CSS anchor positioning, same-document view transitions, scroll-driven animations (`animation-timeline`), `contrast-color()`, `field-sizing`, container style queries for custom properties, `content-visibility`.
- **Limited — enhancement only, wrapped in `@supports`:** `text-wrap: pretty` (Firefox pending), cross-document view transitions (`@view-transition`, Firefox pending), `interpolate-size` / `calc-size()`, customizable `<select>` (`appearance: base-select`), scroll-triggered animations, `margin-trim`.
- Pattern: write the fallback first, then the enhancement inside `@supports (…) { … }`. Never let a missing feature hide content (e.g. a reveal animation that starts at `opacity: 0`).

## 8. Banned anti-patterns

- px font sizes; `vw`-only font sizes; fixed heights on text containers; `width: 100vw` on content.
- `outline: none` without a replacement; `user-scalable=no`; positive `tabindex`.
- Clickable `div`/`span`; placeholder used as label; icon-only buttons with no accessible name.
- Color-only status; gray text below 4.5:1; text baked into images.
- Autoplay with sound; auto-rotating carousels with no pause; motion that ignores reduced-motion preferences.
- `!important` chains; `z-index: 9999`; magic numbers; deep selector chains; IDs for styling.
- Animating width, height, top, left or margin; hover effects that shift layout.
- Lazy-loading the LCP image; images without dimensions; render-blocking third-party embeds above the fold.
- More than two font families; inconsistent radii, shadows or spacing; random one-off colors outside the tokens.
- Essential information shown only on hover; modals on page load; sticky elements that cover focused content.
- Invented content, fake testimonials, fake logos or placeholder text shipped as final.
