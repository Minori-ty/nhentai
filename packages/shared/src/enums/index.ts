import { Enum } from 'enum-plus'
import chineseSvg from '../assets/chinese.svg'
import japanSvg from '../assets/japan.svg'
import englishSvg from '../assets/english.svg'

// ===== 排序方式 =====
export const SortEnum = Enum({
    Date: { value: 'date', label: 'Recent' },
    Today: { value: 'popular-today', label: 'Today' },
    Week: { value: 'popular-week', label: 'Week' },
    AllTime: { value: 'popular', label: 'All Time' },
})

export type SortMode = typeof SortEnum.valueType

// ===== 标签分类 =====
export const TagTypeEnum = Enum({
    Character: { value: 'character', label: 'Characters', route: 'Character' },
    Tag: { value: 'tag', label: 'Tags', route: 'Tag' },
    Artist: { value: 'artist', label: 'Artists', route: 'Artist' },
    Group: { value: 'group', label: 'Groups', route: 'Group' },
    Language: { value: 'language', label: 'Languages', route: 'Language' },
    Category: { value: 'category', label: 'Categories', route: 'Category' },
})

export type TagType = typeof TagTypeEnum.valueType

// ===== 消息类型 =====
export const MsgTypeEnum = Enum({
    Download: { value: 'download', label: '下载' },
    Progress: { value: 'progress', label: '进度' },
    Success: { value: 'success', label: '完成' },
})

export type MsgType = typeof MsgTypeEnum.valueType

// ===== 消息目标 =====
export const MsgTargetEnum = Enum({
    Offscreen: { value: 'offscreen', label: '离屏页' },
    ServiceWorker: { value: 'service_worker', label: '后台' },
})

export type MsgTarget = typeof MsgTargetEnum.valueType

// ===== 语言图标 =====
export const LangEnum = Enum({
    Chinese: { value: 29963, label: '中文', icon: chineseSvg },
    Japanese: { value: 6346, label: '日文', icon: japanSvg },
    English: { value: 12227, label: '英文', icon: englishSvg },
})
