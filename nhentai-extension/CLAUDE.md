# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

nHentai Chrome Extension — replaces the native [nhentai.net](https://nhentai.net) UI with a Vue 3 SPA and adds ZIP download + IndexedDB download-tracking. Built with the **WXT** framework (v0.20.x), Vue 3 Composition API, and Tailwind CSS v4.

## Commands

| Command              | Description                               |
| -------------------- | ----------------------------------------- |
| `pnpm dev`           | Dev mode (Chrome, watches & auto-reloads) |
| `pnpm dev:firefox`   | Dev mode (Firefox)                        |
| `pnpm build`         | Production build to `.output/chrome-mv3/` |
| `pnpm build:firefox` | Production build (Firefox)                |
| `pnpm lint`          | Run oxlint with auto-fix                  |
| `pnpm format`        | Run oxfmt to format all files             |
| `pnpm compile`       | Type-check with vue-tsc (no emit)         |

**Important:** There are no tests in this project. Type-checking is the only static verification — always run `pnpm compile` after making type-sensitive changes.

## Architecture

### Extension entrypoints (WXT convention)

```
entrypoints/
  content.ts          — Content script, runs on *://*.nhentai.net/*
  background.ts       — Service worker, message router
  offscreen/
    index.html        — Offscreen document host page
    index.ts          — Offscreen script, download execution
```

**Content script** (`content.ts`): Scrapes avatar/username from the original page, clears `<body>`, mounts the Vue app with router.

**Background** (`background.ts`): Thin message relay. Content → Background → Offscreen (download requests). Offscreen → Background → Content tab (progress/success). Maintains a `downloadTabs` Map to know which tab to forward back to.

**Offscreen** (`offscreen/index.ts`): Fetches page images, pipes them through `fflate.Zip` for streaming ZIP creation, writes with `streamsaver`. Has CDN failover logic (retries next subdomain `i1` → `i5` on fetch failure). Uses `AsyncTaskPool` for concurrency control (max 3 parallel fetches).

### Vue app structure

```
components/content/
  App.vue              — Root: SearchHeader + <router-view>
  router.ts            — Vue Router (hash mode), 11 routes
  SearchHeader.vue     — Sticky top bar: search input, favorites button, avatar
  SortBar.vue          — Sort mode selector (Date/Today/Week/All-Time)
  GalleryGrid.vue      — 5-column gallery grid with download buttons, IndexedDB sync, image fallback
  PageIndicator.vue    — Page number display
  ConfirmDialog.vue    — Reusable confirmation dialog
  BaseBtn.vue          — Reusable button (6 variants × 3 sizes)
  LoadingSpinner.vue   — Animated loading spinner
  PageLoader.vue       — Centered LoadingSpinner wrapper for page-level loading states
  views/
    Home.vue           — Gallery listing + "Popular Now" section
    Search.vue         — Search results with sort
    Detail.vue         — Single gallery detail (cover, tags, favorite, download, scroll-preview)
    Single.vue         — Scroll-through page viewer
    Favorites.vue      — User's favorites with search
    Tag.vue / Group.vue / Artist.vue / Character.vue / Language.vue / Category.vue
                       — Tag-type browsing pages (driven by useTagPage composable)
```

### Key patterns

- **`_page` marker**: Search/gallery results are typed as `IResult & { _page: number }` to track which page each item came from (used by `PageIndicator` for scroll-position reference).
- **Image fallback**: `utils/imageFallback.ts` — on `<img>` error, cycles CDN thumb subdomains `t1` → `t2` → `t3` → `t4`.
- **Search bus**: `composables/useSearchBus.ts` — a `ref<{query, ts}>` shared between SearchHeader and Search view for cross-component search triggering.
- **Infinite scroll**: `composables/useInfiniteScroll.ts` — `useInfiniteScroll(loadMore)` wraps throttle + 70% scroll detection + mount/unmount. Used by Home, Search, Favorites.
- **Download state tracking**: GalleryGrid syncs download status from IndexedDB via Dexie. State flows: unmarked → percentage (from background progress messages) → green checkmark (on success message).

### API layer (`api/`)

`api/request.ts` wraps `fetch` with base URL `https://nhentai.net/api/v2`. Auth: reads `access_token` from `document.cookie` (content script context). All API functions are typed with interfaces in `api/index.d.ts` and `api/info.d.ts`.

### Enums (`enums/index.ts`)

Uses the `enum-plus` library which creates bidirectional Enum objects (`.value`, `.label`, `.findBy()`). Key enums: `SortEnum`, `TagTypeEnum` (maps tag types to Vue Router route names), `MsgTypeEnum`, `MsgTargetEnum`, `LangEnum`.

### Database (`db/index.ts`)

Dexie-based IndexedDB (`nhentai-download`) with a single table `media` that tracks downloaded gallery IDs. Exposed as `MediaService` with `addMedia`/`deleteMedia`/`hasMedia`/`getAllMedia`.

### Message types (`types/messages.d.ts`)

Discriminated unions keyed by `type` (from `MsgTypeEnum`) / `target` (from `MsgTargetEnum`). Defines the message contracts for the three-context communication flow.

### CSS

Tailwind v4 via `@tailwindcss/vite` plugin, imported with `important` in `assets/css/tailwind.css` to override nhentai.net's default styles. The `asciiOnlyPlugin` in `wxt.config.ts` escapes non-ASCII characters in bundle output to avoid encoding issues.

## Toolchain notes

- **pnpm** is the package manager (see `node_modules/.pnpm` structure).
- **oxlint + oxfmt** replace ESLint + Prettier. Config is inline — there is no oxlintrc.json. `lint-staged` runs both on pre-commit via husky.
- **TypeScript** config extends `.wxt/tsconfig.json` (auto-generated by WXT). Path alias `@/` maps to the project root.
- WXT uses **Rolldown** as its bundler (not webpack or raw Vite).
