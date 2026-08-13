# design-sync notes for thymos-quiz-app

## No self-installed package / no library build

This repo is a private Next.js app (`package.json` has no `main`/`module`/`exports`,
`build` runs `next build`, not a library bundle), and it isn't published, so
`node_modules/thymos-quiz-app` doesn't exist the way the converter expects for a
normal DS repo. Fixed with a **scoped shim directory** (not a full self-symlink —
that creates an infinite `node_modules/thymos-quiz-app/node_modules/thymos-quiz-app/...`
loop that crashes ts-morph's directory walk):

```sh
mkdir -p node_modules/thymos-quiz-app
ln -sfn ../../package.json node_modules/thymos-quiz-app/package.json
ln -sfn ../../src node_modules/thymos-quiz-app/src
ln -sfn ../../tsconfig.json node_modules/thymos-quiz-app/tsconfig.json
```

This directory is NOT committed (lives under `node_modules/`, already gitignored) —
recreate it on every fresh clone / re-sync before running the converter. Do not
symlink the whole repo root into `node_modules/thymos-quiz-app` — only the specific
files/dirs the converter needs (`package.json`, `src/`, `tsconfig.json`; compiled CSS
below has an extra constraint that rules out a symlink for it).

`cfg.srcDir` is set to `src/components/quiz` (not the default `src/`) — the broad
`src/` scan also swept in `src/app/layout.tsx` and `page.tsx`, which are Next.js
routing files, not design-system components, and `layout.tsx` imports `./globals.css`
which esbuild can't resolve as a bare JS import (see below) — that broke the bundle
until scoped down.

No `--entry` / `cfg.entry` is set — the converter runs in **synth-entry mode**,
scanning `src/components/quiz` directly. Passing `--entry` would make the converter
treat that one file as the literal dist bundle and skip src-based component discovery
entirely.

## Compiled CSS (Tailwind v4)

`src/app/globals.css` is `@import "tailwindcss";` — raw, unprocessed. Tailwind v4 has
no separate build step in this repo (compiled at `next build` time via
`@tailwindcss/postcss`), so esbuild can't resolve `"tailwindcss"` directly from that
file (`[WORKSPACE_SIBLING]`-style failure). Fix: run the real build and harvest the
compiled, hashed output into the shim package dir:

```sh
npm run build
mkdir -p node_modules/thymos-quiz-app/.ds-compiled/chunks node_modules/thymos-quiz-app/.ds-compiled/media
cp .next/static/chunks/*.css node_modules/thymos-quiz-app/.ds-compiled/chunks/styles.css   # single chunk today; re-check if this ever splits
cp .next/static/media/*.woff2 node_modules/thymos-quiz-app/.ds-compiled/media/
```

`cfg.cssEntry` = `.ds-compiled/chunks/styles.css`. **Must be a real file (or a symlink
whose realpath resolves) inside `node_modules/thymos-quiz-app/`** — `cfgPath`'s bounds
check requires `cssEntry` to resolve within the package root, so symlinking out to
`.design-sync/.cache/` (outside `node_modules/thymos-quiz-app/`) gets silently skipped
with `! cssEntry: ... resolves outside the package`. A plain copy avoids that. The
compiled CSS's `url(../media/...)` font references are relative, so `chunks/` and
`media/` must stay siblings under `.ds-compiled/`. Re-run this whole recipe
(`buildCmd`) whenever `globals.css` or Tailwind config changes — the hashed
`.next/static/chunks/*.css` filename changes every build, hence copying to a stable
name each time rather than pointing `cssEntry` at the hash directly.

A master copy is also kept at `.design-sync/.cache/compiled/` (durable reference,
gitignored) — but the copy the converter actually reads is the one inside the shim
dir; keep both in sync when re-running the recipe.

## next/image incompatible with standalone bundling

`Logo.tsx` originally used `next/image`'s `<Image>` component, which references
`process.env.NEXT_SUPPORTS_IMMUTABLE_ASSETS` and similar Next-internal env vars at
module scope. Outside Next's own build pipeline there's no `process` global, so
importing it crashed the ENTIRE bundle at eval time (all 29 components, since
they're one IIFE) with `ReferenceError: process is not defined` — this surfaced as
`[BUNDLE_EXPORT]` failures on every component, not just Logo. Fixed (with user
approval) by editing the real `src/components/quiz/primitives/Logo.tsx` to use a
plain `<img src={logo.src}>` instead of `<Image src={logo}>` — same static PNG
import, just without Next's image-optimization component. Loses automatic
lazy-loading/format negotiation for this one 56x56 logo; negligible for an
icon-sized image. If any other component ever imports `next/image`, `next/link`,
or similar App-Router-only APIs, expect the same whole-bundle crash.

## Scope

`componentSrcMap: {"QuizApp": null}` excludes `QuizApp` (the top-level quiz-flow
orchestrator, not a reusable building block). Scope is primitives + shared quiz UI +
the 13 per-question screens (29 components) — user's explicit choice on the first
sync (screens included because they wanted the design agent able to riff on whole
quiz steps, not just pieces). Core primitives/shared components (~15) get authored
previews; screens ship the floor card for now — authorable incrementally later.

## Known render warns

- **IntroVideo / Default** — renders but the `<video>` shows nothing in headless
  capture. Its sources (`/video/thymos-intro.webm`, `.mp4`) are served from the
  Next.js app's `public/` dir at runtime; the design-sync bundle/preview server
  has no such route, so the video never loads a frame to paint. Not fixable via
  preview composition — accepted as a deferred/needs-work component rather than
  chased further. If this ever needs a real preview, the fix is shipping a poster
  frame image asset alongside the sync (out of scope for now).

## Re-sync risks

- The compiled-CSS harvest is a manual step, not run automatically by the
  converter — a re-sync must redo it (or skip it if `globals.css`/tokens didn't
  change) before rebuilding, or the bundle ships stale styling.
- The `.next/static/chunks/*.css` glob assumes a single global CSS chunk. If the
  app grows enough that Next splits CSS per route, this recipe needs to concatenate
  multiple chunks instead of copying one.
- Font files are harvested from `.next/static/media/*.woff2` by extension — if a
  future font is added as `.ttf`/`.otf`, extend the `cp` glob.
