import './assets/css/tailwind.css'

// --- 组件 ---
export { default as App } from './components/App.vue'
export { default as BaseBtn } from './components/BaseBtn.vue'
export { default as ConfirmDialog } from './components/ConfirmDialog.vue'
export { default as GalleryGrid } from './components/GalleryGrid.vue'
export { default as LoadingSpinner } from './components/LoadingSpinner.vue'
export { default as PageIndicator } from './components/PageIndicator.vue'
export { default as PageLoader } from './components/PageLoader.vue'
export { default as SearchHeader } from './components/SearchHeader.vue'
export { default as SortBar } from './components/SortBar.vue'

// --- 视图 ---
export { default as HomeView } from './components/views/Home.vue'
export { default as SearchView } from './components/views/Search.vue'
export { default as DetailView } from './components/views/Detail.vue'
export { default as SingleView } from './components/views/Single.vue'
export { default as FavoritesView } from './components/views/Favorites.vue'
export { default as TagPageView } from './components/views/TagPage.vue'

// --- Composables ---
export { triggerSearch, searchBus } from './composables/useSearchBus'
export { useInfiniteScroll } from './composables/useInfiniteScroll'
export { useTagPage } from './composables/useTagPage'
export { userAvatar, userName, setUserAvatar, setUserName } from './composables/useUserAvatar'

// --- 枚举 ---
export { SortEnum, TagTypeEnum, MsgTypeEnum, MsgTargetEnum } from './enums'
export { LangEnum } from './enums'
export type { SortMode, TagType, MsgType, MsgTarget, TagRouteName } from './enums'

// --- 类型 ---
export type { DownloadManager } from './types/download'
export { DownloadManagerKey } from './types/download'
export { GridColumnsKey } from './types/layout'
