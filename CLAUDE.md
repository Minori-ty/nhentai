# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Overview

pnpm workspace with three packages:

| Package                               | Purpose                                                       | Framework                                 |
| ------------------------------------- | ------------------------------------------------------------- | ----------------------------------------- |
| `packages/shared` (`@nhentai/shared`) | Shared Vue 3 SPA (components, composables, API, enums, types) | Buildless — consumers compile from source |
| `nhentai-extension/`                  | Chrome extension with ZIP download + IndexedDB tracking       | WXT v0.20.x                               |
| `nhentai-tampermonkey/`               | Mobile-optimized userscript (2-column layout, no download)    | Vite + vite-plugin-monkey                 |

## Dependency Model

- **`@nhentai/shared`** is buildless (`"exports": { "./*": "./src/*" }`). Consumers import raw `.ts`/`.vue` files and compile them.
- `vue` and `vue-router` are `peerDependencies` of shared — each consumer provides them.
- `date-fns`, `enum-plus`, `lodash-es` are regular `dependencies` of shared — consumers inherit them via workspace hoisting.
- Platform divergence is handled via Vue `provide/inject`: `GridColumnsKey` (number) for layout, `DownloadManagerKey` (DownloadManager | null) for download features.

## Commands

All commands run from the monorepo root:

| Command                                    | Description                              |
| ------------------------------------------ | ---------------------------------------- |
| `pnpm --filter nhentai-extension compile`  | Type-check extension                     |
| `pnpm --filter nhentai-extension build`    | Build extension to `.output/chrome-mv3/` |
| `pnpm --filter nhentai-tampermonkey build` | Build userscript to `dist/`              |
| `pnpm install`                             | Install all dependencies                 |

**Important:** There are no tests. Type-checking is the only verification — always run type-check + build after any change to shared code.

## Shared Package (`packages/shared/`)

See [packages/shared/CLAUDE.md](packages/shared/CLAUDE.md) for full details. Key import pattern:

```
@nhentai/shared/           imported as
  api/                     @nhentai/shared/api
  enums/                   @nhentai/shared/enums
  composables/             @nhentai/shared/composables/*
  components/              @nhentai/shared/components/*
  types/                   @nhentai/shared/types/*
  utils/                   @nhentai/shared/utils/*
  assets/css/tailwind.css  @nhentai/shared/assets/css/tailwind.css
```

## Platform Differences

| Feature              | Extension                                                | Tampermonkey                 |
| -------------------- | -------------------------------------------------------- | ---------------------------- |
| `GridColumnsKey`     | 5 (default)                                              | 2                            |
| `DownloadManagerKey` | Real impl (IndexedDB + browser.runtime)                  | Not provided (`null`)        |
| Tailwind             | `@tailwindcss/vite` via WXT                              | `@tailwindcss/vite` via Vite |
| Vue/Router           | Bundled in extension                                     | External CDN globals         |
| Router source        | `import router from '@nhentai/shared/components/router'` | Same                         |
