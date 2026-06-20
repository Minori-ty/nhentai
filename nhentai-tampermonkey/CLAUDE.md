# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

nHentai Tampermonkey Userscript — mobile-optimized (2-column layout, no download) alternative to the Chrome extension. Built with **Vite** + **vite-plugin-monkey** + Vue 3 Composition API + Tailwind CSS v4.

The Vue SPA code lives in `@nhentai/shared` ([`../packages/shared/`](../packages/shared/)). This package is a thin shell: entry point, root App wrapper, and platform-specific wiring (mobile layout, CDN externals).

## Commands

| Command      | Description                                               |
| ------------ | --------------------------------------------------------- |
| `pnpm build` | Type-check + build to `dist/nhentai-tampermonkey.user.js` |
| `pnpm dev`   | Dev server with HMR                                       |

**Important:** Always run `pnpm build` after changes to shared code — the userscript compiles shared from source.

## Architecture

### Source files (`src/`)

```
src/
  main.ts           — Entry point: scrapes avatar/username, clears body, mounts Vue app
  App.vue           — Root wrapper: SearchHeader + <router-view>, onMounted route redirect
  vite-env.d.ts     — Vite/monkey type references + *.vue module declaration
```

All 3 source files are thin wrappers. The router is imported directly from `@nhentai/shared/components/router` (no local copy). The actual UI/API/composables live in `@nhentai/shared`.

### Platform differences from Extension

| Aspect               | Tampermonkey                   | Extension                 |
| -------------------- | ------------------------------ | ------------------------- |
| `GridColumnsKey`     | **2** (mobile)                 | 5 (desktop, default)      |
| `DownloadManagerKey` | **Not provided** (null)        | Real impl                 |
| Vue/Router           | **External CDN globals**       | Bundled in extension      |
| Entry mechanism      | Tampermonkey userscript @match | Chrome extension manifest |

### provide/inject wiring

In `src/main.ts`:

```ts
app.provide(GridColumnsKey, 2)
// DownloadManagerKey NOT provided → defaults to null → no download UI
```

### Build config (`vite.config.ts`)

- **Tailwind CSS v4** via `@tailwindcss/vite`
- **vite-plugin-monkey** generates the userscript header + bundles
- **External globals**: `vue` and `vue-router` loaded from jsDelivr CDN (not bundled)
- **Icon**: `logo.svg` embedded as base64 data URI
- **Resolve alias**: `@nhentai/shared` → `../packages/shared/src`

### Shared SPA (in `@nhentai/shared`)

See [packages/shared/CLAUDE.md](../packages/shared/CLAUDE.md) for full shared package documentation. Key things from this package's perspective:

- Router imported as `@nhentai/shared/components/router`
- Views imported as `@nhentai/shared/components/views/*`
- Components imported as `@nhentai/shared/components/*`
- Composables imported as `@nhentai/shared/composables/*`
- CSS imported as `@nhentai/shared/assets/css/tailwind.css`

## Toolchain

- **pnpm** workspace — always run commands from monorepo root or use `pnpm --filter nhentai-tampermonkey build`.
- **Tailwind v4** scans shared package via `@source` directive in shared's `tailwind.css`.
- Output: single `.user.js` file in `dist/`, installable in Tampermonkey/Violentmonkey.
