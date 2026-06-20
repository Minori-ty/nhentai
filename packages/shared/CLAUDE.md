# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@nhentai/shared` — buildless shared package containing the Vue 3 SPA that powers both the Chrome extension and the Tampermonkey userscript. Components, composables, API layer, enums, types, and utility code live here. Consumers import raw `.ts`/`.vue` files from source and compile them.

## Dependency Model

- **Buildless**: `"exports": { "./*": "./src/*" }` — no build step, consumers compile from source.
- **`peerDependencies`**: `vue`, `vue-router` — must be singletons provided by the consumer.
- **`dependencies`**: `date-fns`, `enum-plus`, `lodash-es` — regular deps, hoisted by pnpm.

## File Structure

```
src/
├── api/
│   ├── index.ts          — API functions: searchGallery, getGallery, getGalleryInfo,
│   │                        getFavorites, favoriteGallery, getTagInfo, getTags, getPopular
│   ├── request.ts        — fetch wrapper (base URL, cookie auth)
│   ├── index.d.ts        — ISearchResponse, IResult types
│   ├── info.d.ts         — IGallery, Tag, Page, Title types
│   └── tags.d.ts         — ITags type
│
├── enums/
│   └── index.ts          — SortEnum, TagTypeEnum, MsgTypeEnum, MsgTargetEnum, LangEnum
│                           (enum-plus bidirectional enums)
│
├── composables/
│   ├── useSearchBus.ts   — Reactive event bus (searchBus ref) for cross-component search
│   ├── useInfiniteScroll.ts — Throttled scroll detection, used by Home/Search/Favorites
│   ├── useTagPage.ts     — Shared logic for all 6 tag-type browse pages
│   └── useUserAvatar.ts  — Reactive userAvatar/userName state + setters
│
├── components/
│   ├── App.vue           — Root: SearchHeader + <router-view>, onMounted route redirect
│   ├── router.ts         — Vue Router (hash mode), 11 routes, 6 view components
│   ├── SearchHeader.vue  — Sticky top bar: search, favorites, avatar
│   │                       Desktop: inline buttons. Mobile: hamburger dropdown.
│   ├── SortBar.vue       — Sort mode selector (Date/Today/Week/All-Time)
│   ├── GalleryGrid.vue   — Gallery grid with conditional download UI (v-if="dm")
│   ├── BaseBtn.vue       — Reusable button (6 variants × 3 sizes)
│   ├── ConfirmDialog.vue — Confirmation dialog
│   ├── LoadingSpinner.vue — Animated spinner
│   ├── PageLoader.vue    — Centered spinner wrapper
│   ├── PageIndicator.vue — Sticky page number indicator
│   └── views/
│       ├── Home.vue      — Gallery listing + "Popular Now"
│       ├── Search.vue    — Search results with sort
│       ├── Detail.vue    — Gallery detail (responsive: flex-row desktop, flex-col mobile)
│       ├── Single.vue    — Scroll-through page viewer (responsive image sizing)
│       ├── Favorites.vue — User favorites with search
│       └── TagPage.vue   — Generic tag-type browser (tag/group/artist/character/language/category)
│                           driven by useTagPage, differentiated via tagType prop
│
├── types/
│   ├── download.ts       — DownloadManager interface + DownloadManagerKey InjectionKey
│   └── layout.ts         — GridColumnsKey InjectionKey (number)
│
├── utils/
│   └── imageFallback.ts  — CDN thumbnail subdomain failover (t1→t4)
│
├── assets/
│   ├── css/tailwind.css  — Tailwind v4 entry (import + @source directive)
│   ├── logo.svg          — nHentai logo
│   ├── chinese.svg       — Language icon
│   ├── japan.svg         — Language icon
│   └── english.svg       — Language icon
│
└── env.d.ts              — Vite client types + *.svg module declaration
```

## Key Patterns

### Platform Detection (Mobile vs Desktop)

```ts
import { inject } from 'vue'
import { GridColumnsKey } from '../types/layout'

const columns = inject(GridColumnsKey, 5) // extension defaults to 5, tampermonkey provides 2
const isMobile = columns <= 2
```

- Template classes use **explicit ternary strings** (NOT template literals) so Tailwind v4's scanner can detect them.
- Components using this: `Detail.vue`, `Single.vue`, `SearchHeader.vue`, `PageIndicator.vue`, `GalleryGrid.vue`.

### Download Feature (Extension Only)

```ts
import { inject } from 'vue'
import { DownloadManagerKey } from '../types/download'

const dm = inject(DownloadManagerKey, null)
// dm === null on tampermonkey → all download UI hidden via v-if="dm"
```

### Search Bus

`useSearchBus.ts` exports a `searchBus` ref. `SearchHeader.vue` watches it to sync the input. `Search.vue` and `App.vue` use `triggerSearch()` to fire searches. The `ts` field (timestamp) prevents the initial empty watch from triggering.

### Tag Page Pattern

All 6 tag-type browse pages (tag, group, artist, character, language, category) use a single `TagPage.vue` component. The route passes `tagType` as a static prop:

```ts
// router.ts
{ path: '/tag/:tag', component: TagPage, props: { tagType: 'tag' } }
{ path: '/group/:group', component: TagPage, props: { tagType: 'group' } }
// ... etc
```

`useTagPage(tagType)` reads `route.params[tagType]` for the tag name and handles all data fetching, pagination, and sort logic.

### enum-plus Label Lookup

```ts
import { TagTypeEnum } from '../enums'
const label = TagTypeEnum.label(tagType) // 'character' → 'Characters'
```

### Tailwind v4 Source Scanning

The `@source "../../"` directive in `tailwind.css` tells Tailwind v4 to scan the shared package directory. Without it, classes from shared `.vue` files are not generated.
