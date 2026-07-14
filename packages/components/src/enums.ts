import { Enum } from 'enum-plus'

import chineseSvg from './assets/chinese.svg'
import englishSvg from './assets/english.svg'
import japanSvg from './assets/japan.svg'

export const LangEnum = Enum({
    Chinese: { value: 29963, label: '中文', icon: chineseSvg },
    Japanese: { value: 6346, label: '日文', icon: japanSvg },
    English: { value: 12227, label: '英文', icon: englishSvg },
})
