// 从 @nhentai/api 重导出数据枚举（无 SVG 依赖）
export { SortEnum, TagTypeEnum, MsgTypeEnum, MsgTargetEnum } from '@nhentai/api'
export type { SortMode, TagType, MsgType, MsgTarget, TagRouteName } from '@nhentai/api'

// LangEnum 依赖 SVG 资产，本地定义
import { Enum } from 'enum-plus'

import chineseSvg from './assets/chinese.svg'
import englishSvg from './assets/english.svg'
import japanSvg from './assets/japan.svg'

export const LangEnum = Enum({
    Chinese: { value: 29963, label: '中文', icon: chineseSvg },
    Japanese: { value: 6346, label: '日文', icon: japanSvg },
    English: { value: 12227, label: '英文', icon: englishSvg },
})
