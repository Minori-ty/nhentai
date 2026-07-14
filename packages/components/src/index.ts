import './tailwind.css'

// --- 组件 ---
/** 基础按钮组件，支持多种样式变体和尺寸 */
export { default as BaseBtn } from './components/BaseBtn.vue'
/** 确认弹窗组件，使用原生 `<dialog>` + Teleport 渲染 */
export { default as ConfirmDialog } from './components/ConfirmDialog.vue'
/** 瀑布流画廊网格组件，支持 overlay slot 和无限滚动分页指示 */
export { default as GalleryGrid } from './components/GalleryGrid.vue'
export type { GalleryItem } from './components/GalleryGrid.vue'
/** 加载旋转动画组件，支持 sm / lg 尺寸 */
export { default as LoadingSpinner } from './components/LoadingSpinner.vue'
/** 固定定位分页指示器，自动监听滚动更新当前页 */
export { default as PageIndicator } from './components/PageIndicator.vue'
/** 全屏居中加载占位组件 */
export { default as PageLoader } from './components/PageLoader.vue'
/** 顶部搜索栏组件，支持移动端/桌面端自适应和用户信息展示 */
export { default as SearchHeader } from './components/SearchHeader.vue'
/** 排序栏组件，支持 Recent / Today / Week / All Time 四种排序 */
export { default as SortBar } from './components/SortBar.vue'

// --- 枚举 ---
/** 语言标签枚举（中文 / 日文 / 英文），含对应 SVG icon */
export { LangEnum } from './enums'

// --- 从 @nhentai/api 重导出（方便组件使用者） ---
export type { SortMode, TagType, MsgType, MsgTarget, TagRouteName } from '@nhentai/api'
export { SortEnum, TagTypeEnum, MsgTypeEnum, MsgTargetEnum } from '@nhentai/api'
