import type { InjectionKey } from 'vue'

/** Grid columns count, injected at app level. Extension = 5, Tampermonkey = 2 */
export const GridColumnsKey: InjectionKey<number> = Symbol('gridColumns')
