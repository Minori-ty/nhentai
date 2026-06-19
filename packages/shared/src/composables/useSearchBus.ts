import { ref } from 'vue'

export const searchBus = ref<{ query: string; ts: number }>({ query: '', ts: 0 })

export function triggerSearch(query: string) {
    searchBus.value = { query, ts: Date.now() }
}
