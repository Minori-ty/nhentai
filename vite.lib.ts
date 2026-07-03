import dts from 'vite-plugin-dts'

/** Shared dts plugin for library packages — generates .d.ts with types entry inserted into package.json exports */
export const dtsPlugin = dts({ insertTypesEntry: true })
