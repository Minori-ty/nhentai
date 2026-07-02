import type { InjectionKey } from 'vue'

/** Whether the app is running in mobile layout. Extension (desktop) = false (default), Tampermonkey = true */
export const GridColumnsKey: InjectionKey<boolean> = Symbol('gridColumns')
