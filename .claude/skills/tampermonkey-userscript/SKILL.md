---
name: tampermonkey-userscript
description: vite-plugin-monkey configuration and Tampermonkey userscript development. Use when writing, modifying, or debugging vite-plugin-monkey userscripts — vite.config.ts setup, userscript metadata (@name, @match, @grant, @icon), CDN externalGlobals for framework externals, build output structure, or GM API usage patterns. Triggers on tasks involving Tampermonkey, Violentmonkey, Greasemonkey, userscript, vite-plugin-monkey, or .user.js files.
license: MIT
---

# Tampermonkey Userscript Development

Develop userscripts with modern tooling — Vite, TypeScript, Vue/React/Svelte, and full GM API support. This skill covers `vite-plugin-monkey` configuration and userscript patterns.

## Core principles

1. **vite-plugin-monkey is the build tool** — it bundles your code, generates the userscript header, and wraps your entry point. You write a normal Vite app and get a `.user.js` file.
2. **Framework externals go through CDN** — Vue/React/Router are loaded via `@require` CDN URLs, not bundled. This keeps the userscript small and avoids browser extension CSP issues.
3. **Metadata is auto-generated** — you configure `userscript` options, the plugin writes the `// ==UserScript==` block. `@grant` is auto-detected from your code (opt-out with `autoGrant: false`).
4. **Dev server with hot reload** — `vite` (dev mode) serves the userscript, opens the install page, and auto-reloads on save. Build mode produces a single `.user.js` file.
5. **One entry point** — a single JS/TS file that imports everything else. The plugin wraps it in an IIFE and prepends the userscript header.

## When to load each reference

| Task | Reference(s) to load |
|------|---------------------|
| Configuring the Vite plugin options (entry, build, server) | `references/vite-plugin-monkey-config.md` |
| Setting or customizing userscript metadata (@name, @match, @icon, etc.) | `references/userscript-metadata.md` |
| General understanding of the full stack | Both references |

## Quick reference card

### vite.config.ts — minimal setup
```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import monkey, { cdn } from 'vite-plugin-monkey'

export default defineConfig({
  plugins: [
    vue(),
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'My Userscript',
        namespace: 'my-namespace',
        match: ['*://*.example.com/*'],
        icon: 'https://example.com/icon.png',
      },
      build: {
        fileName: 'my-script.user.js',
        externalGlobals: {
          vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js'),
        },
      },
    }),
  ],
})
```

### Generated userscript output structure
```
// ==UserScript==
// @name         My Userscript
// @namespace    my-namespace
// @version      0.0.0
// @match        *://*.example.com/*
// @icon         https://example.com/icon.png
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/vue@3.5.29/dist/vue.global.prod.js
// ==/UserScript==

(function() {
  // bundled code here
})();
```

### CDN externals — framework globals

Instead of bundling Vue/Router into the userscript, load them as CDN `@require`:

```ts
build: {
  externalGlobals: {
    vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js'),
    'vue-router': cdn.jsdelivr('VueRouter', 'dist/vue-router.global.prod.js'),
  },
}
```

`cdn.jsdelivr()` returns `[exportVarName, urlFactory]`. The `urlFactory` auto-inserts the installed package version. During dev, the first param (`'Vue'`) maps to `window.Vue`. During build, the second param generates the full CDN URL with the correct version.

### Icon — base64 embedded SVG

For local icons, embed as data URI (Tampermonkey doesn't load `file://` URLs):

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const logoSvg = readFileSync(resolve(__dirname, './assets/logo.svg'), 'utf-8')
const logoDataUri = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`

// In monkey() config:
userscript: {
  icon: logoDataUri,
}
```

### Common CDN functions

All return `[exportVarName, urlFactory]`:
- `cdn.jsdelivr('Vue', 'dist/vue.global.prod.js')` — jsDelivr (fast, global CDN)
- `cdn.jsdelivrFastly('Vue', 'dist/vue.global.prod.js')` — Fastly mirror
- `cdn.unpkg('Vue', 'dist/vue.global.prod.js')` — unpkg
- `cdn.cdnjs('Vue', 'dist/vue.global.prod.js')` — cdnjs
- `cdn.npmmirror('Vue')` — npmmirror (China mirror, faster in CN)

### Entry point pattern

The entry file runs as a userscript — it has full DOM access and GM API access:

```ts
// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// Scrape data from the host page before replacing it
const avatarUrl = document.querySelector('img.avatar')?.src

// Replace page content
document.body.innerHTML = ''
const root = document.createElement('div')
root.id = 'app'
document.body.appendChild(root)

// Mount framework app
const app = createApp(App)
app.mount('#app')
```

### Hash-mode routing for userscripts

Always use `createWebHashHistory()` — hash routing doesn't conflict with the host page's URL:

```ts
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [...],
})
```

**Why hash mode:** SPA routing manipulates the URL, which on a userscript runs on someone else's domain. Hash changes (`#/search`) don't trigger page navigation. Path changes (`/search`) would cause a full page load to the host server.

## This project's tampermonkey setup

The monorepo's `nhentai-tampermonkey/` is a mobile-optimized nhentai userscript. Key details:

- **vite-plugin-monkey v8.0.x** — generates `dist/nhentai-tampermonkey.user.js`
- **Vue 3 + Vue Router** — loaded via CDN externals (jsdelivr), not bundled
- **Tailwind CSS v4** — bundled inline via `@tailwindcss/vite`
- **Icon** — `logo.svg` embedded as base64 data URI
- **Shared code** — imports from `@nhentai/shared` (workspace package) via Vite resolve alias
- **Mobile layout** — provides `GridColumnsKey = true` (mobile = 2 columns)
- **No download** — `DownloadManagerKey` not provided → download UI hidden

### Source files (4 files, all thin wrappers)
```
src/
  main.ts      — Entry: scrape avatar/username, clear body, mount Vue, provide GridColumnsKey
  App.vue      — Root: SearchHeader + <router-view>, onMounted route redirect from page URL
  router.ts    — Vue Router (hash mode), imports all 11 views from @nhentai/shared
  vite-env.d.ts — Type declarations for vite/client, vite-plugin-monkey/client, *.vue
```

### Build config highlights
```ts
monkey({
  entry: 'src/main.ts',
  userscript: {
    icon: logoDataUri,           // base64 SVG
    namespace: 'nhentai-tampermonkey',
    name: 'nhentai-tampermonkey',
    match: ['*://*.nhentai.net/*'],
    exclude: ['*://i*.nhentai.net/*'],  // skip image CDN subdomains
  },
  build: {
    externalGlobals: {
      vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js'),
      'vue-router': cdn.jsdelivr('VueRouter', 'dist/vue-router.global.prod.js'),
    },
  },
})
```

### Type checking
```bash
pnpm build   # runs: vue-tsc -b && vite build
```
Type-check comes first because shared code is compiled from source. If shared has type errors, the userscript build fails.
