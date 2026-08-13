## Wrapping and setup

No provider or root wrapper is required — every component is a plain function
component styled with Tailwind utility classes plus CSS custom properties. Nothing
reads from React context. The one page-level default worth matching: the app sets
`body { background: var(--page-bg); color: var(--ink) }` — compose screens on a
`--color-page` background, not white, or cards will look like they're floating on
the wrong canvas.

## Styling idiom: Tailwind v4 utilities bound to design tokens

Every color, radius, and shadow is a Tailwind utility generated from a CSS custom
property (`@theme inline` in `styles.css`) — never hardcode a hex value or an
arbitrary Tailwind color; use the family below.

| Purpose | Utilities |
|---|---|
| Surfaces | `bg-page`, `bg-card-white`, `bg-card-green`, `bg-card-yellow`, `bg-card-tan` |
| Text | `text-ink` (primary), `text-ink-muted`, `text-ink-muted-2` |
| Accent | `bg-gold` (primary CTA/progress fill), `focus:border-gold` (input focus ring), `bg-dark-cta-bg` + `text-dark-cta-text` (dark CTA pair) |
| Option/choice state | `bg-option-bg` `border-option-border` (rest), `bg-option-selected-bg` `border-option-selected-border` (selected) |
| Chip state | `bg-chip-bg` `border-chip-border` (rest), `bg-chip-selected-bg` `border-chip-selected-border` (selected) |
| Form inputs | `border-input-border`, focus ring via `focus:border-gold` |
| Disabled | `bg-disabled-bg` `text-disabled-text` |
| Misc | `border-divider-dotted` (dotted section separators), `text-checkmark` (success/add-row accent) |
| Radius | `rounded-card` (28px, cards), `rounded-pill` (999px, buttons/chips/progress), `rounded-option` (16px, option rows), `rounded-input` (14px, text/select inputs) |
| Shadow | `shadow-card` |
| Type | `font-heading` (Sora — headings, buttons), `font-body` (Public Sans — body text) — set via the `font-heading`/`font-body` utility classes, not inline `font-family` |

Selectable elements (`Chip`, `OptionButton`) are always a two-state pair driven by a
boolean `selected` prop — border + background swap together, never independently.
`ContinueButton`/`DarkButton` are the two CTA idioms: gold-filled for the primary
forward action, dark-filled for a secondary/alternate one; both collapse to `null`
when `visible={false}` rather than rendering disabled.

## Where the truth lives

Read `styles.css` (root) before styling anything new — its `@import` closure
(`_ds_bundle.css` + fonts) is everything a rendered design actually receives. Each
component's own `.d.ts` + `.prompt.md` under `components/<group>/<Name>/` is the
authoritative prop contract; the JSDoc/examples there reflect real usage from this
quiz, not generic examples.

## Idiomatic build snippet

```tsx
<div className="flex flex-col gap-3 sm:flex-row">
  <OptionButton selected={choice === "yes"} onClick={() => setChoice("yes")}>
    Yes, I have a diagnosis
  </OptionButton>
  <OptionButton selected={choice === "no"} onClick={() => setChoice("no")}>
    No diagnosis yet
  </OptionButton>
</div>
```

New layout glue (spacing, flex/grid wrappers around these components) should use
the same Tailwind utility approach — arbitrary values like `text-[15px]` and
`gap-3.5` appear throughout the real components and are consistent with this DS's
idiom, not one-offs to avoid.
