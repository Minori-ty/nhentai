import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getTags, getTagInfo } from '../api'
import type { IResult } from '../api/index.d'
import { SortEnum, type SortMode, type TagType } from '../enums'
import { useInfiniteScroll } from './useInfiniteScroll'

export function useTagPage(type: TagType) {
    const route = useRoute()
    const router = useRouter()

    const name = route.params[type] as string
    const results = ref<(IResult & { _page: number })[]>([])
    const page = ref(1)
    const numPages = ref(1)
    const total = ref(0)
    const sort = ref<SortMode>(SortEnum.Date)
    const loading = ref(false)
    const loadingMore = ref(false)

    const isEnd = computed(() => page.value === numPages.value)

    let tagId = 0

    async function loadFirst() {
        loading.value = true
        results.value = []
        page.value = 1
        try {
            const info = await getTagInfo(type, name)
            tagId = info.id
            total.value = info.count
            const data = await getTags({ tag_id: tagId, page: 1, sort: sort.value })
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
            const data = await getTags({ tag_id: tagId, page: nextPage, sort: sort.value })
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
            const data = await getTags({ tag_id: tagId, page: 1, sort: sort.value })
            results.value = data.result.map((item) => ({ ...item, _page: 1 }))
            numPages.value = data.num_pages
        } finally {
            loading.value = false
        }
    }

    function goToDetail(id: number) {
        router.push({ name: 'Detail', params: { id } })
    }

    useInfiniteScroll(loadMore, page)

    onMounted(() => {
        loadFirst()
    })

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
        setSort,
        goToDetail,
    }
}
