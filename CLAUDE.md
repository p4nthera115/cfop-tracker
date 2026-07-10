# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A React app: cheat sheets for the 57 Rubik's Cube OLL (Orientation of the Last Layer) cases and the 21 PLL (Permutation of the Last Layer) cases, each rendered as a 5x5 plan-view diagram alongside its algorithms. Progress and per-case algorithm preference live in `localStorage`; there is no backend.

Two routes, via `HashRouter` in [src/App.tsx](src/App.tsx): `/` is OLL, `/#/pll` is PLL. It has to be `HashRouter` — `vite.config.ts` keeps `base: './'` so `dist/` runs from *any* GitHub Pages subpath, and `BrowserRouter` would need a `basename` that isn't known at build time. In exchange there's no 404.html to maintain. The two pages are [src/pages/OllPage.tsx](src/pages/OllPage.tsx) and [src/pages/PllPage.tsx](src/pages/PllPage.tsx); they share their chrome via `Page` and their card via `CaseCard`.

## Commands

Use **pnpm**, not npm — `npm install` resolves against the parent `showcase3d` workspace and fails.

```
pnpm dev                    # vite dev server (port 5173)
pnpm build                  # tsc -b && vite build -> dist/
pnpm typecheck              # tsc -b --noEmit
pnpm preview                # serve dist/

python3 verify.py           # validate every algorithm in oll.json AND pll.json
python3 verify.py oll.json  # ...or just the files you name
```

There is no test runner and no linter. `verify.py` is the only correctness check, and it is not optional — see below.

## Data flow

The JSON files are the single source of truth. Both are imported directly into [src/data.ts](src/data.ts) via `resolveJsonModule` (both are in `tsconfig.json`'s `include`) and assigned to `OllData` / `PllData`, so the JSON shape is checked at build time against [src/types.ts](src/types.ts). That check is why the leaf types there are deliberately loose — a grid cell is `string | null`, not a union of the five colour codes, because `resolveJsonModule` widens `"Y"` to `string`. Tightening them would force an `as unknown as` cast and throw the build-time check away. Every case carries:

- `id` — **`number` for OLL (1–57), `string` for PLL (`"H"`, `"Ua"`, `"Ga"`, …).**
- `grid` — 5x5, corners `null`. Row 0 is the back sticker bar, row 4 front, col 0 left, col 4 right; rows/cols 1–3 are the U face itself.
- `setup` — moves that produce the case from a solved cube.
- `algs` — one or more solutions; the first is the default shown.

The two `grid` encodings differ:

|      | inner 3x3 (U face)             | side bars              |
| ---- | ------------------------------ | ---------------------- |
| OLL  | `boolean` — `true` = oriented  | `boolean`              |
| PLL  | always `"Y"` (already oriented) | colour letters `YGRBO` |

Rather than branch, each set normalises to what [src/components/StickerGrid.tsx](src/components/StickerGrid.tsx) speaks — colour codes, plus a `"dark"` sentinel, plus `null` for the four corners. `toStickerGrid()` in [src/data.ts](src/data.ts) does it for OLL: `true` → `"Y"`, `false` → `"dark"` **everywhere, bars included** (an unoriented side sticker is a filled dark bar, not an absent one — mapping it to `null` would silently erase 416 bars), `null` → `null`. PLL passes its colours straight through.

PLL cases add `arrows`: `{ kind: "edge" \| "corner", frm: [r, c], to: [r, c] }`, where the coordinates are **3x3 U-face indices (0–2), not 5x5 grid indices** — add 1 to each to land in the 5x5. `frm` is where the piece sits, `to` where it belongs. Two arrows that are exact reverses of each other render as one double-headed arrow; a 3-cycle has no such pair and stays as three separate arrows.

Note the arrows encode the case **as drawn**, with its AUF baked in. The G perms therefore come through as a 4-cycle of edges plus a corner 2-swap rather than the two 3-cycles you'd see on jperm.net. That is not a bug — it is what the cube actually looks like at that angle, and it agrees with the simulator.

`groups` (the array, not the per-case `group` string) determines section order on the page. `slug()` in [src/data.ts](src/data.ts) turns each group name into the section `id` that both the nav anchors and [src/useActiveSection.ts](src/useActiveSection.ts) rely on — the `IntersectionObserver` root margin there is hardcoded to the sticky header (56px) + navbar (41px), so changing that chrome's height means changing that margin.

Because `HashRouter` owns the fragment, the group nav can't use a bare `href="#fish-shapes"`. `Navbar` emits a `Link` that keeps the route and sets only the hash (`#/pll#edges-only`), and `useScrollToHash()` in [src/components/Page.tsx](src/components/Page.tsx) does the scrolling. Those URLs still work as deep links.

## State

`useProgress(ns)` in [src/useProgress.ts](src/useProgress.ts) is the whole state layer, taking `"oll"` or `"pll"` and keying `localStorage` under `<ns>:completed` and `<ns>:algChoice`. Ids are **strings** throughout (`"1"`, `"Ua"`); `loadCompleted()` coerces, so OLL progress written as numbers before the split still loads.

## Verifying algorithms

[cube.py](cube.py) is a small sticker-permutation cube simulator (`solved()`, `parse()`, `apply()`, `normalize()`, `grid()`). [verify.py](verify.py) uses it to assert, for every case in every file it's given:

1. the `setup` alg leaves F2L intact (i.e. it really is a last-layer state),
2. the simulated U-layer matches the stored `grid` — coerced to booleans first if the grid is an OLL one, detected via `isinstance(grid[1][1], bool)`,
3. every entry in `algs` actually solves that state, AUF included.

**Any edit to `oll.json` or `pll.json` — a new alternative alg, a tweaked setup, a corrected grid — must be followed by `python3 verify.py` returning `0 error(s)` for both files.** A wrong alg is invisible in the UI and silently teaches the user the wrong thing.

`arrows` are *not* verified by `verify.py`; the simulator has no notion of them. Getting an arrow wrong is a silent error. They can be checked against the simulator though — for each U-layer cubie, its home position is the sum of the home normals of its sticker colours (`{n: c for n, c in COLOR.items()}` inverts the map), and inner-3x3 coords are `(z + 1, x + 1)`. All 21 cases currently agree with the simulator.

## Styling

Tailwind v4 with CSS-first config: there is **no `tailwind.config`**. Theme tokens are declared in `@theme inline` in [src/index.css](src/index.css), which also adds `--success` / `--success-foreground` on top of the shadcn palette (used for the "learned" card state).

shadcn components (style `radix-nova`, see `components.json`) live in [src/components/ui/](src/components/ui/) and are vendored — edit them in place rather than wrapping. `@/` aliases `src/` in both Vite and TypeScript.

The sticker diagram is **not** Tailwind: `.sticker-grid` and the `.sticker-*` cell/bar/colour classes are plain CSS in the `@layer components` block of `index.css`. [src/components/StickerGrid.tsx](src/components/StickerGrid.tsx) only maps cell value + position to a class name.

Its *lengths*, though, live in [src/components/stickerGeometry.ts](src/components/stickerGeometry.ts) and are applied as inline custom properties (`--sticker-cell`, `--sticker-bar`, `--sticker-gap`, `--sticker-bar-track`). That module is also what positions the SVG arrow overlay, so the two can't drift: resize the grid there and the arrows follow. Don't move those lengths back into `index.css`.

Arrows are an absolutely-positioned `<svg>` over the grid. Each is drawn twice — a dark 4px underlay, then the 2px white stroke — because `paint-order: stroke` can't outline a `<line>` (no fill to paint over). The arrowhead `<marker>`s get a `useId()` suffix, since marker ids are document-global and there are 21 grids on the page.

The app is dark-mode only: `class="dark"` is hardcoded on `<html>` in [index.html](index.html) and there is no toggle.

## Deployment

`vite.config.ts` sets `base: './'` so `dist/` works from any GitHub Pages subpath. Keep it relative.
