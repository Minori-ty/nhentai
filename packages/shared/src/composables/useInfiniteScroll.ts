import { throttle } from 'lodash-es'
import { onMounted, onUnmounted, type Ref } from 'vue'

export function useInfiniteScroll(loadMore: () => void, page: Ref<number>) {
    const handleScroll = throttle(() => {
        const { scrollTop, clientHeight, scrollHeight } = document.documentElement
        // 动态阈值：page 1→50%, page 15→85%, 之后缓慢收敛到 100%
        const p = Math.max(page.value, 1)
        const threshold = 1 - 3 / (p + 5)
        if (scrollTop + clientHeight >= scrollHeight * threshold) {
            loadMore()
        }
    }, 300)

    onMounted(() => window.addEventListener('scroll', handleScroll))
    onUnmounted(() => window.removeEventListener('scroll', handleScroll))
}
