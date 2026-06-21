# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

nHentai Chrome Extension — replaces the native [nhentai.net](https://nhentai.net) UI with a Vue 3 SPA and adds ZIP download + IndexedDB download-tracking. Built with **WXT** v0.20.x, Vue 3 Composition API, and Tailwind CSS v4.

The Vue SPA code lives in `@nhentai/shared` ([`../packages/shared/`](../packages/shared/)). This package provides the Chrome extension shell: WXT entrypoints, IndexedDB, download execution, and wires up the `DownloadManager` implementation.

## Commands

| Command              | Description                               |
| -------------------- | ----------------------------------------- |
| `pnpm dev`           | Dev mode (Chrome, watches & auto-reloads) |
| `pnpm dev:firefox`   | Dev mode (Firefox)                        |
| `pnpm build`         | Production build to `.output/chrome-mv3/` |
| `pnpm build:firefox` | Production build (Firefox)                |
| `pnpm compile`       | Type-check with vue-tsc (no emit)         |

**Important:** There are no tests. Always run `pnpm compile` after type-sensitive changes.

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

**Content script** (`content.ts`): Scrapes avatar/username from the original page, clears `<body>`, mounts the Vue app from `@nhentai/shared/components/App.vue`. Provides `DownloadManagerKey` (real download manager) and default `GridColumnsKey` (5 = desktop).

**Background** (`background.ts`): Thin message relay. Content → Background → Offscreen (download requests). Offscreen → Background → Content tab (progress/success). Maintains a `downloadTabs` Map.

**Offscreen** (`offscreen/index.ts`): Fetches page images, pipes through `fflate.Zip` for streaming ZIP creation, writes with `streamsaver`. CDN failover (`i1` → `i5` on fetch failure). Uses `AsyncTaskPool` for concurrency control (max 3 parallel fetches).

### Extension-specific files

```
db/
  index.ts               — Dexie IndexedDB (nhentai-download), MediaService class
types/
  messages.d.ts          — Discriminated unions for content↔background↔offscreen messages
utils/
  AsyncTaskPool.ts       — Concurrency pool for parallel downloads
  downloadManager.ts     — DownloadManager impl wrapping MediaService + browser.runtime messages
wxt.config.ts            — WXT config: @wxt-dev/module-vue, @wxt-dev/auto-icons (auto-generates
                           icons from assets/icon.png, no extra config needed), @tailwindcss/vite,
                           ascii-only output plugin
```

### Shared SPA (in `@nhentai/shared`)

See [packages/shared/CLAUDE.md](../packages/shared/CLAUDE.md) for full shared package documentation. Key things from this package's perspective:

- Components imported as `@nhentai/shared/components/*`
- Views imported as `@nhentai/shared/components/views/*`
- Composables imported as `@nhentai/shared/composables/*`
- API/enums/types imported as `@nhentai/shared/api`, `@nhentai/shared/enums`, etc.

### provide/inject wiring

In `content.ts`:

```ts
app.provide(DownloadManagerKey, createDownloadManager())
// GridColumnsKey NOT provided → defaults to 5 (desktop)
```

## Toolchain

- **pnpm** workspace — always run commands from monorepo root or use `--filter`.
- **WXT** uses Rolldown as bundler. Config in `wxt.config.ts`.
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin in WXT's vite config.
- **No ESLint/Prettier** — uses oxlint + oxfmt (config at monorepo root).
