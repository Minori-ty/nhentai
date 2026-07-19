import { getTags, getTagInfo, type IResult } from '@nhentai/api'
import { SortEnum, type SortMode, type TagType } from '@nhentai/api'
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

import { useInfiniteScroll } from './useInfiniteScroll'
import { useRetryCountdown } from './useRetryCountdown'

type TagRouteName = 'Tag' | 'Group' | 'Artist' | 'Character' | 'Language' | 'Category'

export function useTagPage(type: TagType) {
    const route = useRoute<TagRouteName>()
    const name = computed(() => route.params.name)

    const results = ref<(IResult & { _page: number })[]>([])
    const page = ref(1)
    const numPages = ref(1)
    const total = ref(0)
    const sort = ref<SortMode>(SortEnum.Date)
    const loading = ref(false)
    const loadingMore = ref(false)

    const isEnd = computed(() => page.value === numPages.value)

    const { retryCountdown, requestWithRetry } = useRetryCountdown()

    let tagId = 0

    async function loadFirst() {
        loading.value = true
        results.value = []
        page.value = 1
        try {
            const info = await requestWithRetry(() => getTagInfo(type, name.value))
            tagId = info.id
            total.value = info.count
            const data = await requestWithRetry(() => getTags({ tag_id: tagId, page: 1, sort: sort.value }))
            results.value = data.result.map((item) => ({ ...item, _page: 1 }))
            numPages.value = data.num_pages
        } finally {
            loading.value = false
        }
    }

    async function loadMore() {
        if (loadingMore.value || isEnd.value) return
        loadingMore.value = true
        const nextPage = page.value + 1
        try {
            const data = await requestWithRetry(() => getTags({ tag_id: tagId, page: nextPage, sort: sort.value }))
            results.value.push(...data.result.map((item) => ({ ...item, _page: nextPage })))
            page.value = nextPage
            numPages.value = data.num_pages
        } finally {
            loadingMore.value = false
        }
    }

    async function setSort(mode: SortMode) {
        if (sort.value === mode) return
        sort.value = mode
        loading.value = true
        results.value = []
        page.value = 1
        try {
            const data = await requestWithRetry(() => getTags({ tag_id: tagId, page: 1, sort: sort.value }))
            results.value = data.result.map((item) => ({ ...item, _page: 1 }))
            numPages.value = data.num_pages
        } finally {
            loading.value = false
        }
    }

    useInfiniteScroll(loadMore, page)

    // 监听路由参数和 tagType 变化，支持 KeepAlive 下切换不同 tag
    watch(
        [() => route.params.name, () => type],
        ([name]) => {
            if (name) loadFirst()
        },
        { immediate: true },
    )

    return {
        name,
        results,
        page,
        numPages,
        total,
        sort,
        loading,
        loadingMore,
        isEnd,
        retryCountdown,
        setSort,
    }
}
