import { getTags, getTagInfo, SortEnum, type IResult, type SortMode, type TagType } from '@nhentai/api'
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

import { useInfiniteScroll } from './useInfiniteScroll'
import { useRetryCountdown } from './useRetryCountdown'

type TagRouteName = 'Tag' | 'Group' | 'Artist' | 'Character' | 'Language' | 'Category'

/**
 * 标签页数据逻辑。
 *
 * @param getType 标签类型的 getter（**必须传函数**）。
 *   6 条标签路由共用同一个 `TagPage` 组件，vue-router 在它们之间跳转时会复用组件实例，
 *   `props.tagType` 会变但 setup 不会重跑——如果直接传值，闭包里会一直是最初的类型。
 */
export function useTagPage(getType: () => TagType) {
    const route = useRoute<TagRouteName>()
    const name = computed(() => route.params.name)
    const type = computed(getType)

    const results = ref<(IResult & { _page: number })[]>([])
    const page = ref(1)
    const numPages = ref(1)
    const total = ref(0)
    const sort = ref<SortMode>(SortEnum.Date)
    const loading = ref(false)
    const loadingMore = ref(false)

    const isEnd = computed(() => page.value >= numPages.value)

    const { retryCountdown, requestWithRetry } = useRetryCountdown()

    let tagId = 0
    /** 请求序号：快速切换标签时丢弃过期响应，避免旧结果覆盖新结果 */
    let seq = 0

    async function loadFirst() {
        const current = ++seq
        loading.value = true
        results.value = []
        page.value = 1
        tagId = 0
        try {
            const info = await requestWithRetry(() => getTagInfo(type.value, name.value))
            if (current !== seq) return
            tagId = info.id
            total.value = info.count

            const data = await requestWithRetry(() => getTags({ tag_id: tagId, page: 1, sort: sort.value }))
            if (current !== seq) return
            results.value = data.result.map((item) => ({ ...item, _page: 1 }))
            numPages.value = data.num_pages
        } catch (err) {
            console.error('[TagPage] 加载标签失败', err)
        } finally {
            if (current === seq) loading.value = false
        }
    }

    async function loadMore() {
        if (loadingMore.value || isEnd.value || tagId === 0) return
        const current = seq
        loadingMore.value = true
        const nextPage = page.value + 1
        try {
            const data = await requestWithRetry(() => getTags({ tag_id: tagId, page: nextPage, sort: sort.value }))
            if (current !== seq) return
            results.value.push(...data.result.map((item) => ({ ...item, _page: nextPage })))
            page.value = nextPage
            numPages.value = data.num_pages
        } catch (err) {
            console.error('[TagPage] 加载更多失败', err)
        } finally {
            loadingMore.value = false
        }
    }

    async function setSort(mode: SortMode) {
        if (sort.value === mode || tagId === 0) return
        sort.value = mode

        const current = ++seq
        loading.value = true
        results.value = []
        page.value = 1
        try {
            const data = await requestWithRetry(() => getTags({ tag_id: tagId, page: 1, sort: sort.value }))
            if (current !== seq) return
            results.value = data.result.map((item) => ({ ...item, _page: 1 }))
            numPages.value = data.num_pages
        } catch (err) {
            console.error('[TagPage] 切换排序失败', err)
        } finally {
            if (current === seq) loading.value = false
        }
    }

    useInfiniteScroll(loadMore, page)

    // 监听路由参数与标签类型：两者任一变化都要重新拉取（KeepAlive 下组件实例会复用）
    watch(
        [name, type],
        ([nextName]) => {
            if (nextName) void loadFirst()
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
