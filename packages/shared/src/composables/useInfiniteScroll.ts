import { onMounted, onUnmounted } from 'vue'
import { throttle } from 'lodash-es'

export function useInfiniteScroll(loadMore: () => void) {
    const handleScroll = throttle(() => {
        const { scrollTop, clientHeight, scrollHeight } = document.documentElement
        if (scrollTop + clientHeight >= scrollHeight * 0.7) {
            loadMore()
        }
    }, 300)

    onMounted(() => window.addEventListener('scroll', handleScroll))
    onUnmounted(() => window.removeEventListener('scroll', handleScroll))
}
