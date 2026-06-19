# Userscript Metadata Reference

The `userscript` option in `vite-plugin-monkey` controls the `// ==UserScript==` header block. This reference covers all supported metadata directives across Tampermonkey, Violentmonkey, and Greasemonkey.

## Core metadata (all engines)

### Identification
| Field | Directive | Description |
|-------|-----------|-------------|
| `name` | `@name` | Script display name. Supports locale variants: `{ '': 'Default', 'zh-CN': '中文名' }` |
| `namespace` | `@namespace` | Unique identifier, often a URL or package name |
| `version` | `@version` | Semantic version. Auto-read from `package.json` if omitted |
| `author` | `@author` | Author name. Default: `'monkey'` |
| `description` | `@description` | Script description. Supports locale variants like `name` |
| `license` | `@license` | License identifier. Default: `'MIT'` |

### URL matching (required)
| Field | Directive | Description |
|-------|-----------|-------------|
| `match` | `@match` | URL patterns where the script runs. Use `*` as wildcard |
| `include` | `@include` | More flexible patterns (supports RegExp). Alternative to `@match` |
| `exclude` | `@exclude` | URL patterns to exclude |
| `noframes` | `@noframes` | Set `true` to prevent running in iframes |

**Match pattern syntax:**
```
*://*.example.com/*        — all paths on example.com and subdomains
https://example.com/foo*   — specific protocol + path prefix
*://*.nhentai.net/*        — all subdomains of nhentai.net, any protocol
```

### Icons
| Field | Directive | Note |
|-------|-----------|------|
| `icon` | `@icon` | Primary icon URL or data URI |
| `iconURL` | `@icon` | Alias for `icon` |
| `defaulticon` | `@icon` | Alias for `icon` |
| `icon64` | `@icon64` | 64×64 icon (separate from `@icon`) |
| `icon64URL` | `@icon64` | Alias for `icon64` |

**Using local files as icons:** Tampermonkey can't load `file://` URLs or local paths. You must use:
- **Remote URL:** `'https://example.com/icon.png'`
- **Base64 data URI:** Embed the file as a data URI at build time (see SKILL.md for pattern)

### Update & support URLs
| Field | Directive | Description |
|-------|-----------|-------------|
| `updateURL` | `@updateURL` | URL to check for script updates |
| `downloadURL` | `@downloadURL` | URL to download the full script |
| `supportURL` | `@supportURL` | Link to support/help page |
| `homepage` / `homepageURL` / `website` / `source` | `@homepage` / `@homepageURL` / `@website` / `@source` | Link to script homepage |

### Permissions
| Field | Directive | Description |
|-------|-----------|-------------|
| `grant` | `@grant` | GM API permissions. Set manually or use `autoGrant: true` |
| `connect` | `@connect` | Allowed `GM_xmlhttpRequest` domains |
| `resource` | `@resource` | External resources loaded via `GM_getResourceText/URL` |
| `require` | `@require` | External JS libraries to load before the script |

### Other
| Field | Directive | Description |
|-------|-----------|-------------|
| `copyright` | `@copyright` | Copyright statement |
| `tag` | `@tag` | Tags for categorizing on GreasyFork |
| `sandbox` | `@sandbox` | Sandbox mode: `'raw'`, `'JavaScript'`, or `'DOM'` |
| `unwrap` | `@unwrap` | Prevent Tampermonkey from unwrapping the script |
| `antifeature` | `@antifeature` | Declare monetization/ads/tracking (GreasyFork requirement) |

## Engine-specific metadata

### Tampermonkey-specific
| Field | Directive | Description |
|-------|-----------|-------------|
| `run-in` | `@run-in` | Where to inject: `'document'`, `'context'`, etc. |
| `webRequest` | `@webRequest` | `GM_webRequest` rules for intercepting network requests |

### Violentmonkey-specific
| Field | Directive | Description |
|-------|-----------|-------------|
| `run-at` | `@run-at` | Injection timing: `'document-start'`, `'document-end'`, `'document-idle'` |
| `inject-into` | `@inject-into` | Context: `'page'` (page world), `'content'` (isolated), `'auto'` |

## Locale support

`name` and `description` support multi-language variants. The key `''` is the default (fallback):

```ts
userscript: {
  name: {
    '': 'My Script',          // default name
    'zh-CN': '我的脚本',      // Chinese (Simplified)
    'ja': 'マイスクリプト',   // Japanese
  },
  description: {
    '': 'Does something useful',
    'zh-CN': '做一些有用的事情',
    'ja': '何か便利なことをする',
  },
}
```

Generated output:
```
// @name         My Script
// @name:zh-CN   我的脚本
// @name:ja      マイスクリプト
// @description         Does something useful
// @description:zh-CN   做一些有用的事情
// @description:ja      何か便利なことをする
```

## Meta file (update check optimization)

When `build.metaFileName` is enabled, a separate `.meta.js` file is generated containing **only the header**, no code. This is paired with `@updateURL`:

```ts
build: {
  metaFileName: true,  // generates .meta.js alongside .user.js
},
userscript: {
  updateURL: 'https://example.com/my-script.meta.js',
  downloadURL: 'https://example.com/my-script.user.js',
}
```

**Why:** Tampermonkey periodically downloads the `.meta.js` file to check `@version`. If the version changed, it downloads the full `.user.js`. The `.meta.js` is tiny (~1KB vs ~500KB), saving bandwidth on every update check.

## Auto-grant behavior

When `autoGrant: true` (default), the plugin scans the final bundle for GM API usage:

```ts
// If your code uses:
GM_setValue('key', 'value')
GM_getValue('key')
GM_addStyle('body { color: red }')

// The plugin automatically adds:
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_addStyle
```

Common GM APIs:
- `GM_setValue` / `GM_getValue` — persistent key-value storage
- `GM_deleteValue` / `GM_listValues` — storage management
- `GM_addStyle` — inject CSS into the page
- `GM_getResourceText` / `GM_getResourceURL` — access `@resource` assets
- `GM_xmlhttpRequest` — cross-origin requests
- `GM_openInTab` — open URLs in new tabs
- `GM_notification` — desktop notifications
- `GM_setClipboard` — write to clipboard
- `GM_info` — get script metadata at runtime

Set `autoGrant: false` if you want to manually control `@grant`:

```ts
userscript: {
  grant: ['GM_setValue', 'GM_addStyle'],
}
```

## Common match patterns

```ts
// Run on all pages of a domain
match: ['*://*.example.com/*']

// Run on specific pages only
match: ['https://example.com/dashboard/*']

// Run on multiple domains
match: ['*://*.site-a.com/*', '*://*.site-b.com/*']

// Exclude subdomains
match: ['*://*.nhentai.net/*'],
exclude: ['*://i*.nhentai.net/*']  // skip image CDN subdomains

// Run everywhere (dangerous, needs good reason)
match: ['*://*/*']
```

## This project's metadata

```ts
// nhentai-tampermonkey/vite.config.ts
userscript: {
  icon: logoDataUri,                // base64 embedded SVG
  namespace: 'nhentai-tampermonkey',
  name: 'nhentai-tampermonkey',
  description: 'Enhanced mobile-friendly UI for nhentai.net',
  match: ['*://*.nhentai.net/*'],
  exclude: ['*://i*.nhentai.net/*'], // skip nhentai's image CDN subdomains
}
```

**Why exclude image CDN subdomains:** nhentai serves images from `i1.nhentai.net`, `i2.nhentai.net`, etc. Running the userscript on those subdomains is unnecessary — they only serve images, not HTML pages. Excluding them avoids wasted script execution and potential interference.
