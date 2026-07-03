import type { InjectionKey } from 'vue'

/** Whether the app is running in mobile layout. Extension (desktop) = false (default), Tampermonkey = true */
export const GridColumnsKey: InjectionKey<boolean> = Symbol('gridColumns')

/** Whether router-links should open in a new tab. Extension = true (needs _blank), Tampermonkey = false (in-page navigation) */
export const OpenInNewTabKey: InjectionKey<boolean> = Symbol('openInNewTab')
