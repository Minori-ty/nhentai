# vite-plugin-monkey Configuration Reference

Complete reference for the `MonkeyOption` object passed to the `monkey()` plugin.

## Top-level options

```ts
import monkey from 'vite-plugin-monkey'

monkey({
  entry: 'src/main.ts',          // required — userscript entry file
  userscript?: MonkeyUserScript, // userscript metadata overrides
  align?: number | false,        // align userscript comment block (default: 2)
  generate?: (opts) => string,   // custom header generator function
  clientAlias?: string,          // alias for vite-plugin-monkey/dist/client (default: '$')
  styleImport?: boolean,         // auto-inject style imports
  server?: { ... },              // dev server options
  build?: { ... },               // build output options
})
```

## `server` — dev server options

Controls the dev experience when running `vite` (not `vite build`).

```ts
server: {
  /**
   * Auto-open the install URL in default browser when userscript changes.
   * Also sets `viteConfig.server.open ??= monkeyConfig.server.open`.
   * @default true on Windows/Mac, false elsewhere
   */
  open?: boolean

  /**
   * Name prefix to distinguish dev server scripts from build scripts
   * in the monkey extension's install list.
   * Set to `false` to disable prefix.
   * Can be a string or a function `(name: string) => string`.
   * @default 'server:'
   */
  prefix?: string | ((name: string) => string) | false

  /**
   * Mount GM API functions to `unsafeWindow` for dev convenience.
   * Allows accessing GM_* functions from browser console.
   * @default false
   */
  mountGmApi?: boolean
}
```

**Why the `server:` prefix matters:** In dev mode, the script name becomes `server:My Userscript`. This separates it from the production `.user.js` in Tampermonkey's installed scripts list. Clicking the dev server URL installs/updates the dev version; building installs the prod version. Without the prefix, you'd overwrite one with the other.

## `build` — build output options

Controls the production build (`vite build`).

```ts
build: {
  /**
   * Output filename. Must end with '.user.js'.
   * @default `${packageJsonName ?? 'monkey'}.user.js`
   */
  fileName?: string

  /**
   * Generate a separate .meta.js file containing only the userscript header.
   * Used with @updateURL for lightweight update checks — Tampermonkey
   * downloads this small file to check version changes instead of the full script.
   *
   * - `false` (default): don't generate
   * - `true`: auto-name (replaces .user.js with .meta.js)
   * - `string`: custom filename (must end with '.meta.js')
   * - `function`: takes fileName, returns metaFileName
   */
  metaFileName?: string | boolean | ((fileName: string) => string)

  /**
   * Auto-detect GM API usage and add @grant directives.
   * When true (default), the plugin analyzes the final bundle for GM_* calls
   * and automatically generates the correct @grant headers.
   * Set to false to manually declare grants in `userscript.grant`.
   * @default true
   */
  autoGrant?: boolean

  /**
   * External JS libraries loaded via @require CDN URLs.
   * Modules listed here are excluded from the bundle and loaded at runtime.
   *
   * Accepts two formats:
   * - Object: `{ moduleName: urlOrArray }`
   * - Array of tuples: `[[moduleName, urlOrArray], ...]`
   *
   * Each value can be:
   * - `string`: the global variable name (no auto CDN URL)
   * - `function`: `(version, name, importName) => string` (dynamic var name)
   * - `Array`: first element is exportVarName, rest are require URLs
   */
  externalGlobals?: ExternalGlobals

  /**
   * External CSS/assets loaded via @resource directives.
   * Resources listed here are excluded from the bundle and loaded at runtime.
   *
   * Keys are import names (e.g., 'element-plus/dist/index.css').
   * Values can be:
   * - `string`: resource name
   * - `Pkg2UrlFn`: function generating resource URL
   * - Object with: `{ resourceUrl, resourceName?, loader? }`
   */
  externalResource?: ExternalResource

  /**
   * Module loading strategy for dynamic imports.
   * - `'inline'`: inline SystemJS (smaller, but no CDN caching)
   * - `ModuleToUrlFc`: load SystemJS from CDN URL
   * @default cdn.jsdelivr()[1]  (load from jsdelivr CDN)
   */
  systemjs?: 'inline' | ModuleToUrlFc

  /**
   * Custom CSS injection handler.
   * Called for each CSS chunk. Default behavior wraps in GM_addStyle() call.
   *
   * @default
   * (css: string): void => {
   *   if (typeof GM_addStyle !== 'undefined') {
   *     GM_addStyle(css)
   *   } else {
   *     const style = document.createElement('style')
   *     style.textContent = css
   *     document.head.append(style)
   *   }
   * }
   */
  cssSideEffects?: (css: string) => void
}
```

## `externalGlobals` in detail

This is the most important build option. It tells Rollup to NOT bundle specified modules and instead loads them via `@require` CDN URLs at runtime.

### Format 1: Simple global name (rarely used alone)
```ts
externalGlobals: {
  vue: 'Vue',           // window.Vue must exist at runtime
  'vue-router': 'VueRouter',
}
```
This generates `@require` but you must provide the URL manually via `userscript.require`.

### Format 2: cdn utility (recommended)
```ts
externalGlobals: {
  vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js'),
  // cdn.jsdelivr() returns ['Vue', urlFactory]
  // urlFactory auto-inserts the installed package version
}
```

### Format 3: Array with multiple URLs (chain fallbacks)
```ts
externalGlobals: {
  vue: [
    'Vue',                                              // global name
    cdn.jsdelivr('', 'dist/vue.global.prod.js'),       // primary CDN
  ],
}
// Or chain with .concat():
externalGlobals: {
  vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js')
    .concat('https://unpkg.com/vue-demi@latest/lib/index.iife.js')
    .concat(util.dataUrl(';window.Vue=Vue;')),
}
```

### Format 4: Array of tuples (ordered dependencies)
```ts
externalGlobals: [
  ['vue', cdn.jsdelivr('Vue', 'dist/vue.global.prod.js')],
  ['vue-router', cdn.jsdelivr('VueRouter', 'dist/vue-router.global.prod.js')],
  ['pinia', cdn.jsdelivr('Pinia', 'dist/pinia.iife.prod.js')],
]
```

### How it works

For `externalGlobals: { vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js') }`:

1. Rollup marks `vue` as external (not bundled)
2. At build time, `cdn.jsdelivr()` generates: `https://cdn.jsdelivr.net/npm/vue@3.5.29/dist/vue.global.prod.js` (version from node_modules)
3. Plugin adds: `// @require https://cdn.jsdelivr.net/npm/vue@3.5.29/dist/vue.global.prod.js`
4. In the bundled code, `import { ref } from 'vue'` becomes `const { ref } = window.Vue`
5. The CDN script sets `window.Vue`, so the global is available when the userscript executes

### `util.dataUrl()`

Embeds inline JavaScript as a data URL (for polyfills or small scripts):
```ts
import { util } from 'vite-plugin-monkey'

externalGlobals: {
  vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js')
    .concat(util.dataUrl(';window.Vue=Vue;')),
  // This adds an inline @require that runs after the CDN script:
  // @require data:application/javascript,;window.Vue=Vue;
}
```

## CDN utilities — full list

All imported from `vite-plugin-monkey`:
```ts
import { cdn } from 'vite-plugin-monkey'
```

| Function | CDN | URL Pattern |
|----------|-----|-------------|
| `cdn.jsdelivr(varName?, path?)` | jsDelivr | `https://cdn.jsdelivr.net/npm/${name}@${version}/${path}` |
| `cdn.jsdelivrFastly(varName?, path?)` | jsDelivr Fastly | Fastly edge |
| `cdn.unpkg(varName?, path?)` | unpkg | `https://unpkg.com/${name}@${version}/${path}` |
| `cdn.cdnjs(varName?, path?)` | cdnjs | Cloudflare CDN |
| `cdn.npmmirror(varName?, path?)` | npmmirror | China mirror (fast in CN) |
| `cdn.elemecdn(varName?, path?)` | Element CDN | China |
| `cdn.bdstatic(varName?, path?)` | Baidu Static | China |
| `cdn.zhimg(varName?, path?)` | Zhihu CDN | China |
| `cdn.bootcdn(varName?, path?)` | BootCDN | China |
| `cdn.staticfile(varName?, path?)` | Staticfile | China |

All return `[exportVarName | undefined, urlFactory]`. The first param (`exportVarName`) defaults to global matching the package name if omitted. The second param (`path`) is the file path within the package.

## CSS handling

### Default behavior (inline CSS)
CSS imports get bundled and injected via `GM_addStyle()`:
```ts
import './style.css'  // → wrapped in GM_addStyle() call in output
```

The default `cssSideEffects` function tries `GM_addStyle` first, falls back to creating a `<style>` element.

### External CSS (CDN)
Move large CSS libraries to CDN via `externalResource`:
```ts
build: {
  externalResource: {
    'element-plus/dist/index.css': cdn.jsdelivr(),
    // generates: @resource css_0 https://cdn.jsdelivr.net/npm/element-plus@x.y.z/dist/index.css
    // and      : @grant GM_getResourceText
    // and      : @grant GM_addStyle
  },
}
```

### Custom CSS injection
```ts
build: {
  cssSideEffects: (css: string): void => {
    // Custom injection logic
    if (typeof GM_addStyle !== 'undefined') {
      GM_addStyle(css)
    } else {
      const style = document.createElement('style')
      style.textContent = css
      document.head.append(style)
    }
  },
}
```

## Type reference directives

In `vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-monkey/client" />
```

- `vite/client` — Vite's type augmentations (import.meta.env, asset imports)
- `vite-plugin-monkey/client` — GM API type declarations (GM_setValue, GM_getValue, etc.)
- `vite-plugin-monkey/style` — optional, for CSS module types

## Build output

After `vite build`, the `dist/` directory contains:
```
dist/
├── nhentai-tampermonkey.user.js     # installable userscript
└── nhentai-tampermonkey.meta.js     # (optional) header-only for @updateURL
```

The `.user.js` file is a single self-contained file:
1. Userscript header block (`// ==UserScript==` ... `// ==/UserScript==`)
2. IIFE wrapping all bundled code
3. CSS injected via `GM_addStyle()` calls
4. External dependencies loaded via `@require` before the IIFE runs
